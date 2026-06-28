import { readFileSync } from "node:fs";

import { Prisma, PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const prisma = new PrismaClient();

function getArg(name: string) {
  const prefix = `--${name}=`;
  const value = process.argv.find((item) => item.startsWith(prefix));
  return value ? value.slice(prefix.length) : null;
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function nullIfMissing<T>(value: T | null | undefined) {
  return value ?? null;
}

function toCreateManyRow(
  value: Record<string, unknown>,
): Prisma.GaokaoMajorPlanCreateManyInput | null {
  const sourceId = typeof value.source_id === "string" ? value.source_id : "";
  const schoolCode = typeof value.school_code === "string" ? value.school_code : "";
  const schoolName = typeof value.school_name === "string" ? value.school_name : "";
  const majorName = typeof value.major_name === "string" ? value.major_name : "";

  if (!sourceId || !schoolCode || !schoolName || !majorName) {
    return null;
  }

  return {
    source_id: sourceId,
    year: Number(value.year),
    province: String(value.province ?? "四川"),
    subject_type: String(value.subject_type ?? "未标注"),
    batch: nullIfMissing(value.batch as string | null),
    plan_type: nullIfMissing(value.plan_type as string | null),
    school_code: schoolCode,
    school_name: schoolName,
    school_major_group_code: nullIfMissing(value.school_major_group_code as string | null),
    group_code: nullIfMissing(value.group_code as string | null),
    group_name: nullIfMissing(value.group_name as string | null),
    major_code: nullIfMissing(value.major_code as string | null),
    major_full_name: nullIfMissing(value.major_full_name as string | null),
    major_name: majorName,
    major_note: nullIfMissing(value.major_note as string | null),
    other_note: nullIfMissing(value.other_note as string | null),
    subject_requirement: nullIfMissing(value.subject_requirement as string | null),
    degree_level: nullIfMissing(value.degree_level as string | null),
    plan_count: nullIfMissing(value.plan_count as number | null),
    tuition: nullIfMissing(value.tuition as number | null),
    duration: nullIfMissing(value.duration as string | null),
    group_plan_count: nullIfMissing(value.group_plan_count as number | null),
    group_major_count: nullIfMissing(value.group_major_count as number | null),
    group_cleanliness: nullIfMissing(value.group_cleanliness as number | null),
    major_category: nullIfMissing(value.major_category as string | null),
    major_class: nullIfMissing(value.major_class as string | null),
    estimated_rank_2026: nullIfMissing(value.estimated_rank_2026 as number | null),
    is_new: Boolean(value.is_new),
    group_admit_count_2025: nullIfMissing(value.group_admit_count_2025 as number | null),
    group_score_2025: nullIfMissing(value.group_score_2025 as number | null),
    group_rank_2025: nullIfMissing(value.group_rank_2025 as number | null),
    admit_count_2025: nullIfMissing(value.admit_count_2025 as number | null),
    score_2025: nullIfMissing(value.score_2025 as number | null),
    rank_2025: nullIfMissing(value.rank_2025 as number | null),
    average_score_2025: nullIfMissing(value.average_score_2025 as number | null),
    average_rank_2025: nullIfMissing(value.average_rank_2025 as number | null),
    admit_count_2024: nullIfMissing(value.admit_count_2024 as number | null),
    score_2024: nullIfMissing(value.score_2024 as number | null),
    rank_2024: nullIfMissing(value.rank_2024 as number | null),
    average_score_2024: nullIfMissing(value.average_score_2024 as number | null),
    average_rank_2024: nullIfMissing(value.average_rank_2024 as number | null),
    admit_count_2023: nullIfMissing(value.admit_count_2023 as number | null),
    score_2023: nullIfMissing(value.score_2023 as number | null),
    rank_2023: nullIfMissing(value.rank_2023 as number | null),
    average_score_2023: nullIfMissing(value.average_score_2023 as number | null),
    average_rank_2023: nullIfMissing(value.average_rank_2023 as number | null),
    school_province: nullIfMissing(value.school_province as string | null),
    school_city: nullIfMissing(value.school_city as string | null),
    city_level_label: nullIfMissing(value.city_level_label as string | null),
    school_tags: nullIfMissing(value.school_tags as string | null),
    school_level: nullIfMissing(value.school_level as string | null),
    school_type: nullIfMissing(value.school_type as string | null),
    ownership: nullIfMissing(value.ownership as string | null),
    school_rank: nullIfMissing(value.school_rank as number | null),
    postgraduate_rate: nullIfMissing(value.postgraduate_rate as number | null),
    transfer_policy: nullIfMissing(value.transfer_policy as string | null),
    admission_rule: nullIfMissing(value.admission_rule as string | null),
    charter_url: nullIfMissing(value.charter_url as string | null),
    major_rating: nullIfMissing(value.major_rating as string | null),
    major_ranking: nullIfMissing(value.major_ranking as number | null),
    discipline_eval: nullIfMissing(value.discipline_eval as string | null),
    major_level: nullIfMissing(value.major_level as string | null),
    source_file: nullIfMissing(value.source_file as string | null),
  };
}

async function importChunk(rows: Prisma.GaokaoMajorPlanCreateManyInput[]) {
  if (rows.length === 0) {
    return 0;
  }

  const result = await prisma.gaokaoMajorPlan.createMany({
    data: rows,
    skipDuplicates: true,
  });
  return result.count;
}

async function main() {
  const dataPath = getArg("file") ?? "data/gaokao/sichuan-2026-major-plans.ndjson";
  const dryRun = hasFlag("dry-run");
  const replace = hasFlag("replace");
  let parsedRows = 0;
  let importedRows = 0;
  let skippedRows = 0;
  const rows: Prisma.GaokaoMajorPlanCreateManyInput[] = [];

  for (const line of readFileSync(dataPath, "utf8").split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }
    parsedRows += 1;
    const row = toCreateManyRow(JSON.parse(line) as Record<string, unknown>);
    if (!row) {
      skippedRows += 1;
      continue;
    }
    rows.push(row);
  }

  if (replace && !dryRun) {
    await prisma.gaokaoMajorPlan.deleteMany({
      where: { source_id: { startsWith: "sichuan2026-major-plan:" } },
    });
  }

  if (!dryRun) {
    for (let index = 0; index < rows.length; index += 1000) {
      importedRows += await importChunk(rows.slice(index, index + 1000));
    }
  }

  console.log(
    JSON.stringify(
      {
        file: dataPath,
        parsedRows,
        importedRows: dryRun ? null : importedRows,
        skippedRows,
        dryRun,
        replace,
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
