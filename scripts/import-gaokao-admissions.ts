import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import { PrismaClient, Prisma } from "@prisma/client";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

type RawRow = Record<string, string>;

const prisma = new PrismaClient();

function getArg(name: string) {
  const prefix = `--${name}=`;
  const value = process.argv.find((item) => item.startsWith(prefix));
  return value ? value.slice(prefix.length) : null;
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function toInt(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/[,，]/g, "").trim();
  if (!normalized) {
    return null;
  }

  const lessThan = normalized.match(/^小于(\d+)$/);
  if (lessThan) {
    return Math.max(1, Number.parseInt(lessThan[1], 10) - 1);
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSubject(value: string | undefined) {
  const text = (value ?? "").trim();

  if (/历史|文科/.test(text)) {
    return "历史类";
  }

  if (/物理|理科/.test(text)) {
    return "物理类";
  }

  return text || "未标注";
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      cell += "\"";
      index += 1;
      continue;
    }

    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(cell);
      cell = "";
      continue;
    }

    cell += char;
  }

  cells.push(cell);
  return cells.map((item) => item.trim());
}

function parseCsv(content: string) {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function toCreateManyRow(
  row: RawRow,
  sourceId: string,
): Prisma.GaokaoAdmissionRecordCreateManyInput | null {
  const province = (row.province ?? "").trim();
  const year = toInt(row.year);
  const schoolName = (row.school_name ?? row.schoolName ?? row.school ?? "").trim();

  if (!province || !year || !schoolName) {
    return null;
  }

  return {
    source_id: sourceId,
    province,
    year,
    subject_type: normalizeSubject(row.subject_type ?? row.category),
    batch: (row.batch ?? "").trim() || null,
    school_name: schoolName,
    major_name: (row.major_name ?? row.majorName ?? row.major ?? "").trim() || null,
    score: toInt(row.score),
    rank: toInt(row.rank),
    quota: toInt(row.quota),
    source_file: (row.source_file ?? row.sourceFile ?? "").trim() || null,
    raw_payload: row,
  };
}

function loadRowsFromSqlite(dbPath: string, province: string, limit: number | null) {
  const sql = [
    ".headers on",
    ".mode csv",
    `select id, province, year, category, batch, school_name, major_name, score, rank, quota, source_file from admission where province = '${province.replace(/'/g, "''")}' order by year desc, rank asc${limit ? ` limit ${limit}` : ""};`,
  ].join("\n");

  const result = spawnSync("sqlite3", [dbPath], {
    input: sql,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || "读取 SQLite 数据失败");
  }

  return parseCsv(result.stdout).map((row) =>
    toCreateManyRow(row, row.id ? `xuefeng:${row.id}` : `xuefeng:${row.province}:${row.year}:${row.school_name}`),
  );
}

function loadRowsFromCsv(csvPath: string, province: string, limit: number | null) {
  const rows = parseCsv(readFileSync(csvPath, "utf8"));
  return rows
    .filter((row) => (row.province ?? "").trim() === province)
    .slice(0, limit ?? undefined)
    .map((row, index) =>
      toCreateManyRow(row, row.source_id?.trim() || `csv:${path.basename(csvPath)}:${index + 2}`),
    );
}

async function importChunk(rows: Prisma.GaokaoAdmissionRecordCreateManyInput[]) {
  if (rows.length === 0) {
    return 0;
  }

  const result = await prisma.gaokaoAdmissionRecord.createMany({
    data: rows,
    skipDuplicates: true,
  });
  return result.count;
}

async function main() {
  const province = getArg("province") ?? "四川";
  const dbPath = getArg("db") ?? "data/gaokao/admission_clean.db";
  const csvPath = getArg("csv");
  const limit = toInt(getArg("limit") ?? undefined);
  const dryRun = hasFlag("dry-run");
  const rawRows = csvPath
    ? loadRowsFromCsv(csvPath, province, limit)
    : loadRowsFromSqlite(dbPath, province, limit);
  const rows = rawRows.filter(Boolean) as Prisma.GaokaoAdmissionRecordCreateManyInput[];

  if (dryRun) {
    console.log(
      JSON.stringify({ province, source: csvPath ?? dbPath, parsedRows: rows.length }, null, 2),
    );
    return;
  }

  let imported = 0;

  for (let index = 0; index < rows.length; index += 1000) {
    imported += await importChunk(rows.slice(index, index + 1000));
  }

  console.log(
    JSON.stringify(
      {
        province,
        source: csvPath ?? dbPath,
        parsedRows: rows.length,
        importedRows: imported,
        warning:
          rows.length === 0
            ? "当前数据源没有匹配的四川记录，需要补充四川官方投档/一分一段/批次线数据后再导入。"
            : null,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
