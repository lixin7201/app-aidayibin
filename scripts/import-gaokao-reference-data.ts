import { readFileSync } from "node:fs";

import { PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

type ReferenceData = {
  batchLines: Array<{
    year: number;
    province: string;
    subjectType: string;
    batch: string;
    score: number;
    sourceUrl: string;
  }>;
  scoreSegments: Array<{
    year: number;
    province: string;
    subjectType: string;
    score: number;
    sameScoreCount: number;
    cumulativeRank: number;
    lineType: string;
    sourceUrl: string;
  }>;
};

const prisma = new PrismaClient();
const dataPath = process.argv.find((item) => item.startsWith("--file="))?.slice(7)
  ?? "data/gaokao/sichuan-2026-reference.json";
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const data = JSON.parse(readFileSync(dataPath, "utf8")) as ReferenceData;

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          file: dataPath,
          batchLines: data.batchLines.length,
          scoreSegments: data.scoreSegments.length,
        },
        null,
        2,
      ),
    );
    return;
  }

  for (const item of data.batchLines) {
    await prisma.gaokaoBatchLine.upsert({
      where: {
        year_province_subject_type_batch: {
          year: item.year,
          province: item.province,
          subject_type: item.subjectType,
          batch: item.batch,
        },
      },
      create: {
        year: item.year,
        province: item.province,
        subject_type: item.subjectType,
        batch: item.batch,
        score: item.score,
        source_url: item.sourceUrl,
      },
      update: {
        score: item.score,
        source_url: item.sourceUrl,
      },
    });
  }

  for (const item of data.scoreSegments) {
    await prisma.gaokaoScoreSegment.upsert({
      where: {
        year_province_subject_type_score: {
          year: item.year,
          province: item.province,
          subject_type: item.subjectType,
          score: item.score,
        },
      },
      create: {
        year: item.year,
        province: item.province,
        subject_type: item.subjectType,
        score: item.score,
        same_score_count: item.sameScoreCount,
        cumulative_rank: item.cumulativeRank,
        line_type: item.lineType,
        source_url: item.sourceUrl,
      },
      update: {
        same_score_count: item.sameScoreCount,
        cumulative_rank: item.cumulativeRank,
        line_type: item.lineType,
        source_url: item.sourceUrl,
      },
    });
  }

  console.log(
    JSON.stringify(
      {
        importedBatchLines: data.batchLines.length,
        importedScoreSegments: data.scoreSegments.length,
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
