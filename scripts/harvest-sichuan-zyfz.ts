import { createDecipheriv, createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { Prisma, PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const ZYFZ_BASE_URL = "https://zyfz.sceeic.cn";
const SM4_KEY = Buffer.from("sceeictosceeadat", "utf8");
const DEFAULT_PICI = "本科批B段";
const DEFAULT_SYSTEM_YEAR = 2026;
const DEFAULT_DELAY_MS = 350;

const prisma = new PrismaClient();

type ZyfzResponse<T> = {
  code: number;
  message?: string;
  msg?: string;
  jiami?: boolean;
  data: T;
  maxyema?: number;
  fenshu?: number;
  weici?: string | number;
  dwf?: string | number;
};

type CandidateRow = {
  zhidakaosheng?: string;
  zhidaokaosheng?: string;
  kelei__kelei?: string;
  keleimc?: string;
  fenshu?: number;
};

type ListRow = Record<string, unknown> & {
  yxid?: number;
  yuanxiaomingcheng?: string;
  zhuanyezumingcheng?: string;
  xuankaokemuyaoqiu?: string;
};

type SchoolHistoryYear = {
  jihuashu?: number | string | null;
  pingjunfen?: number | string | null;
  pingjunfenweici?: number | string | null;
  shilushu?: number | string | null;
  zuidifen?: number | string | null;
  zuidifenweici?: number | string | null;
  zuidifendengweifen?: number | string | null;
};

type SchoolHistoryRow = Record<string, unknown> & {
  yxid?: number;
  zhuanyezumingcheng?: string;
  xuankaokemuyaoqiu?: string;
  quannian?: SchoolHistoryYear | null;
  qiannian?: SchoolHistoryYear | null;
  daqiannian?: SchoolHistoryYear | null;
};

type OutputRow = {
  source_id: string;
  province: string;
  year: string;
  subject_type: string;
  batch: string;
  school_name: string;
  major_name: string;
  score: string;
  rank: string;
  quota: string;
  source_file: string;
  group_code: string;
  subject_requirement: string;
  admitted_count: string;
  average_score: string;
  average_rank: string;
  equivalent_score: string;
  school_yxid: string;
  raw_rank: string;
};

function getArg(name: string) {
  const prefix = `--${name}=`;
  const item = process.argv.find((value) => value.startsWith(prefix));
  return item ? item.slice(prefix.length) : null;
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function toInt(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const text = String(value ?? "").replace(/[,，]/g, "").trim();
  if (!text) {
    return null;
  }

  const lessThan = text.match(/^小于(\d+)$/);
  if (lessThan) {
    return Math.max(1, Number.parseInt(lessThan[1], 10) - 1);
  }

  const parsed = Number.parseInt(text, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function normalizeSubjectType(candidate: CandidateRow | null) {
  const text = `${candidate?.kelei__kelei ?? ""}${candidate?.keleimc ?? ""}`;
  if (/史|历史|文科/.test(text)) {
    return "历史类";
  }
  if (/物|物理|理科/.test(text)) {
    return "物理类";
  }
  return "未标注";
}

function decryptSm4Hex(hex: string) {
  const decipher = createDecipheriv("sm4-ecb", SM4_KEY, null);
  decipher.setAutoPadding(true);
  return Buffer.concat([
    decipher.update(Buffer.from(hex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

async function requestZyfz<T>(
  cookie: string,
  endpoint: string,
  options: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<ZyfzResponse<T>> {
  const response = await fetch(`${ZYFZ_BASE_URL}${endpoint}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json,text/plain,*/*",
      "Content-Type": "application/json",
      Cookie: cookie,
      "User-Agent": "Mozilla/5.0",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`官网请求失败：HTTP ${response.status} ${text.slice(0, 120)}`);
  }

  const payload = JSON.parse(text) as ZyfzResponse<T | string>;
  if (payload.code !== 200) {
    throw new Error(payload.message || payload.msg || `官网返回 code=${payload.code}`);
  }

  if (payload.jiami && typeof payload.data === "string") {
    return {
      ...payload,
      data: JSON.parse(decryptSm4Hex(payload.data)) as T,
    };
  }

  return payload as ZyfzResponse<T>;
}

function buildListPayload(pici: string, page: number) {
  return {
    pici,
    yxguanjianci: "",
    zyguanjianci: "",
    jfx: 0,
    diqu: [],
    kemuyaoqiu: "",
    gouxuangongban: false,
    gouxuanmingban: false,
    gouxuanjunxiao: false,
    hezuobanxueyuanxiao: false,
    neidigangao: false,
    dulixueyuan: false,
    gouxuan985: false,
    gouxuan211: false,
    gouxuanshuangyiliu: false,
    gouxuanhuozhaoban: false,
    dwfqujian: [],
    wcqujian: [],
    gouxuanquankong: false,
    zyleilei: 0,
    yema: page,
    zckzyleilei: [],
    zhuanyelei: [],
    bckzyleilei: [],
    xiaozhuanye: false,
    tiqianpijihualeixin: "",
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStableSourceId(input: {
  subjectType: string;
  pici: string;
  year: number;
  schoolName: string;
  yxid?: number;
  groupCode: string;
  requirement: string;
}) {
  const seed = [
    input.subjectType,
    input.pici,
    input.year,
    input.schoolName,
    input.yxid ?? "",
    input.groupCode,
    input.requirement,
  ].join("|");
  const digest = createHash("sha1").update(seed).digest("hex").slice(0, 16);
  return `zyfz:${input.year}:${input.yxid ?? "na"}:${digest}`;
}

function makeMajorName(groupCode: string, requirement: string) {
  return `专业组${groupCode || "未标注"}${requirement ? `（选科：${requirement}）` : ""}`;
}

function normalizeHistoryRows(input: {
  schoolName: string;
  pici: string;
  subjectType: string;
  systemYear: number;
  rows: SchoolHistoryRow[];
}) {
  const yearMap = [
    { year: input.systemYear - 1, key: "quannian" },
    { year: input.systemYear - 2, key: "qiannian" },
    { year: input.systemYear - 3, key: "daqiannian" },
  ] as const;
  const output: OutputRow[] = [];

  for (const row of input.rows) {
    const groupCode = toCell(row.zhuanyezumingcheng);
    const requirement = toCell(row.xuankaokemuyaoqiu);

    for (const item of yearMap) {
      const history = row[item.key];
      if (!history?.zuidifen && !history?.zuidifenweici) {
        continue;
      }

      const rank = toInt(history.zuidifenweici);
      output.push({
        source_id: getStableSourceId({
          subjectType: input.subjectType,
          pici: input.pici,
          year: item.year,
          schoolName: input.schoolName,
          yxid: row.yxid,
          groupCode,
          requirement,
        }),
        province: "四川",
        year: String(item.year),
        subject_type: input.subjectType,
        batch: input.pici,
        school_name: input.schoolName,
        major_name: makeMajorName(groupCode, requirement),
        score: toCell(history.zuidifen),
        rank: rank ? String(rank) : "",
        quota: toCell(history.jihuashu),
        source_file: "zyfz.sceeic.cn:/zyfz/chaxun/luqushuju/",
        group_code: groupCode,
        subject_requirement: requirement,
        admitted_count: toCell(history.shilushu),
        average_score: toCell(history.pingjunfen),
        average_rank: toCell(history.pingjunfenweici),
        equivalent_score: toCell(history.zuidifendengweifen),
        school_yxid: toCell(row.yxid),
        raw_rank: toCell(history.zuidifenweici),
      });
    }
  }

  return output;
}

function toCsv(rows: OutputRow[]) {
  const headers = [
    "source_id",
    "province",
    "year",
    "subject_type",
    "batch",
    "school_name",
    "major_name",
    "score",
    "rank",
    "quota",
    "source_file",
    "group_code",
    "subject_requirement",
    "admitted_count",
    "average_score",
    "average_rank",
    "equivalent_score",
    "school_yxid",
    "raw_rank",
  ] satisfies Array<keyof OutputRow>;

  const escape = (value: string) => {
    if (/[",\n\r]/.test(value)) {
      return `"${value.replace(/"/g, "\"\"")}"`;
    }
    return value;
  };

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ].join("\n");
}

function toCreateManyInput(row: OutputRow): Prisma.GaokaoAdmissionRecordCreateManyInput {
  return {
    source_id: row.source_id,
    province: row.province,
    year: toInt(row.year) ?? DEFAULT_SYSTEM_YEAR - 1,
    subject_type: row.subject_type,
    batch: row.batch,
    school_name: row.school_name,
    major_name: row.major_name,
    score: toInt(row.score),
    rank: toInt(row.rank),
    quota: toInt(row.quota),
    source_file: row.source_file,
    raw_payload: row as unknown as Prisma.InputJsonObject,
  };
}

async function importRows(rows: OutputRow[]) {
  let imported = 0;
  for (let index = 0; index < rows.length; index += 1000) {
    const chunk = rows.slice(index, index + 1000).map(toCreateManyInput);
    const result = await prisma.gaokaoAdmissionRecord.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    imported += result.count;
  }
  return imported;
}

async function main() {
  const cookie = process.env.ZYFZ_COOKIE?.trim();
  if (!cookie) {
    throw new Error("请通过 ZYFZ_COOKIE 环境变量传入四川志愿辅助系统登录 cookie。");
  }

  const pici = getArg("pici") ?? DEFAULT_PICI;
  const systemYear = toInt(getArg("system-year")) ?? DEFAULT_SYSTEM_YEAR;
  const startPage = toInt(getArg("start-page")) ?? 1;
  const pageLimit = hasFlag("all") ? null : toInt(getArg("pages")) ?? 2;
  const maxSchools = toInt(getArg("max-schools"));
  const delayMs = toInt(getArg("delay-ms")) ?? DEFAULT_DELAY_MS;
  const shouldImport = hasFlag("import");
  const outPath =
    getArg("out") ??
    path.join(
      "data",
      "gaokao",
      `sichuan-zyfz-${pici}-${new Date().toISOString().slice(0, 10)}.csv`,
    );

  const candidateResp = await requestZyfz<CandidateRow[]>(cookie, "/zyfz/kaosheng/chakan/");
  const candidate = candidateResp.data[0] ?? null;
  const subjectType = normalizeSubjectType(candidate);
  const firstPage = await requestZyfz<ListRow[]>(cookie, "/zyfz/chaxun/zhuanyezu/", {
    method: "POST",
    body: buildListPayload(pici, startPage),
  });
  const totalPages = Number(firstPage.maxyema ?? startPage);
  const endPage = pageLimit ? Math.min(totalPages, startPage + pageLimit - 1) : totalPages;
  const listRows = [...firstPage.data];

  console.log(
    JSON.stringify(
      {
        pici,
        subjectType,
        totalPages,
        startPage,
        endPage,
        firstPageRows: firstPage.data.length,
      },
      null,
      2,
    ),
  );

  for (let page = startPage + 1; page <= endPage; page += 1) {
    await sleep(delayMs);
    const response = await requestZyfz<ListRow[]>(cookie, "/zyfz/chaxun/zhuanyezu/", {
      method: "POST",
      body: buildListPayload(pici, page),
    });
    listRows.push(...response.data);
    if (page % 20 === 0 || page === endPage) {
      console.log(`已读取列表页 ${page}/${endPage}，累计专业组 ${listRows.length}`);
    }
  }

  const schoolNames = Array.from(
    new Set(
      listRows
        .map((row) => toCell(row.yuanxiaomingcheng).trim())
        .filter(Boolean),
    ),
  ).slice(0, maxSchools ?? undefined);
  const outputRows: OutputRow[] = [];
  const failures: Array<{ school: string; error: string }> = [];

  for (let index = 0; index < schoolNames.length; index += 1) {
    const schoolName = schoolNames[index];
    await sleep(delayMs);

    try {
      const history = await requestZyfz<SchoolHistoryRow[]>(
        cookie,
        "/zyfz/chaxun/luqushuju/",
        {
          method: "POST",
          body: { name: schoolName, pici },
        },
      );
      outputRows.push(
        ...normalizeHistoryRows({
          schoolName,
          pici,
          subjectType,
          systemYear,
          rows: history.data,
        }),
      );
    } catch (error) {
      failures.push({
        school: schoolName,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    if ((index + 1) % 20 === 0 || index + 1 === schoolNames.length) {
      console.log(
        `已读取院校 ${index + 1}/${schoolNames.length}，累计历史记录 ${outputRows.length}`,
      );
    }
  }

  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${toCsv(outputRows)}\n`, "utf8");

  const importedRows = shouldImport ? await importRows(outputRows) : 0;
  console.log(
    JSON.stringify(
      {
        pici,
        subjectType,
        schools: schoolNames.length,
        outputRows: outputRows.length,
        failures: failures.length,
        importedRows,
        outPath,
        warning:
          subjectType === "物理类"
            ? "当前 cookie 对应物理方向考生；历史类数据建议再提供一个历史类登录态单独采集。"
            : null,
      },
      null,
      2,
    ),
  );

  if (failures.length > 0) {
    console.log(JSON.stringify({ failures: failures.slice(0, 20) }, null, 2));
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
