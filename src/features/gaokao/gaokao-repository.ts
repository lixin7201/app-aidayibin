import type { GaokaoReport } from "@prisma/client";

import type {
  GaokaoDataStatus,
  GaokaoProfile,
  GaokaoRecommendationBucket,
  GaokaoRecommendationItem,
  GaokaoRecommendations,
  GaokaoReportListItem,
  GaokaoSubjectType,
} from "@/features/gaokao/types";
import { signResultShareToken } from "@/lib/auth/result-share-token";
import { prisma } from "@/lib/db/prisma";
import { buildResultSharePageUrl } from "@/lib/share/result-share";

function toSubjectType(value: string): GaokaoSubjectType {
  return /历史|文科/.test(value) ? "历史类" : "物理类";
}

function getRankGap(userRank: number | null, recordRank: number | null) {
  if (!userRank || !recordRank) {
    return null;
  }

  return recordRank - userRank;
}

function mapItem(
  record: {
    id: string;
    school_name: string;
    major_name: string | null;
    year: number;
    subject_type: string;
    batch: string | null;
    score: number | null;
    rank: number | null;
    quota: number | null;
  },
  profile: GaokaoProfile,
  bucket: GaokaoRecommendationBucket,
): GaokaoRecommendationItem {
  const rankGap = getRankGap(profile.rank, record.rank);
  const riskLabel =
    bucket === "chong" ? "冲刺" : bucket === "wen" ? "相对匹配" : "兜底";
  const reason =
    rankGap === null
      ? "该条记录有历史分数参考，但位次字段不完整，建议结合招生计划二次核对。"
      : bucket === "chong"
        ? `历史位次比你靠前 ${Math.abs(rankGap)} 名左右，适合放在冲刺区，不建议当稳。`
        : bucket === "wen"
          ? `历史位次与你接近，差距约 ${Math.abs(rankGap)} 名，适合重点比较专业和城市。`
          : `历史位次比你靠后 ${Math.abs(rankGap)} 名左右，主要用于降低滑档风险。`;

  return {
    id: record.id,
    schoolName: record.school_name,
    majorName: record.major_name,
    year: record.year,
    subjectType: toSubjectType(record.subject_type),
    batch: record.batch,
    score: record.score,
    rank: record.rank,
    quota: record.quota,
    rankGap,
    riskLabel,
    reason,
  };
}

function keywordMatched(text: string, keywords: string[]) {
  if (keywords.length === 0) {
    return true;
  }

  return keywords.some((keyword) => text.includes(keyword));
}

function filterByPreference<T extends { school_name: string; major_name: string | null }>(
  records: T[],
  profile: GaokaoProfile,
) {
  return records.filter((record) => {
    const text = `${record.school_name} ${record.major_name ?? ""}`;

    if (!keywordMatched(text, profile.preferredMajors)) {
      return false;
    }

    if (profile.rejectedMajors.some((keyword) => text.includes(keyword))) {
      return false;
    }

    return true;
  });
}

async function findRankRecords(input: {
  profile: GaokaoProfile;
  minRank: number;
  maxRank: number;
  take: number;
}) {
  const rows = await prisma.gaokaoAdmissionRecord.findMany({
    where: {
      province: "四川",
      subject_type: input.profile.subjectType ?? undefined,
      rank: {
        gte: input.minRank,
        lte: input.maxRank,
      },
    },
    orderBy: [{ year: "desc" }, { rank: "asc" }],
    take: input.take * 4,
  });

  return filterByPreference(rows, input.profile).slice(0, input.take);
}

async function findScoreRecords(input: {
  profile: GaokaoProfile;
  minScore: number;
  maxScore: number;
  take: number;
  direction: "asc" | "desc";
}) {
  const rows = await prisma.gaokaoAdmissionRecord.findMany({
    where: {
      province: "四川",
      subject_type: input.profile.subjectType ?? undefined,
      score: {
        gte: input.minScore,
        lte: input.maxScore,
      },
    },
    orderBy: [{ year: "desc" }, { score: input.direction }],
    take: input.take * 4,
  });

  return filterByPreference(rows, input.profile).slice(0, input.take);
}

export async function getGaokaoDataStatus(): Promise<GaokaoDataStatus> {
  const [importedCount, sourceCount, batchLineCount, scoreSegmentCount, years] = await Promise.all([
    prisma.gaokaoAdmissionRecord.count({ where: { province: "四川" } }),
    prisma.gaokaoAdmissionRecord.count(),
    prisma.gaokaoBatchLine.count({ where: { province: "四川" } }),
    prisma.gaokaoScoreSegment.count({ where: { province: "四川" } }),
    prisma.gaokaoAdmissionRecord.findMany({
      where: { province: "四川" },
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "desc" },
    }),
  ]);

  return {
    province: "四川",
    importedCount,
    sourceCount,
    batchLineCount,
    scoreSegmentCount,
    years: years.map((item) => item.year),
    missingSichuanData: importedCount === 0,
  };
}

export async function completeGaokaoProfileFromReferenceData(
  profile: GaokaoProfile,
): Promise<GaokaoProfile> {
  if (!profile.subjectType || !profile.score || profile.rank) {
    return profile;
  }

  const segment = await prisma.gaokaoScoreSegment.findUnique({
    where: {
      year_province_subject_type_score: {
        year: profile.examYear,
        province: "四川",
        subject_type: profile.subjectType,
        score: profile.score,
      },
    },
  });

  if (!segment) {
    return profile;
  }

  return {
    ...profile,
    rank: segment.cumulative_rank,
  };
}

export async function buildGaokaoRecommendations(
  profile: GaokaoProfile,
): Promise<GaokaoRecommendations> {
  const empty = { chong: [], wen: [], bao: [] };

  if (!profile.subjectType || (!profile.rank && !profile.score)) {
    return empty;
  }

  if (profile.rank) {
    const rank = profile.rank;
    const [chong, wen, bao] = await Promise.all([
      findRankRecords({
        profile,
        minRank: Math.max(1, Math.floor(rank * 0.72)),
        maxRank: Math.max(1, Math.floor(rank * 0.98)),
        take: 12,
      }),
      findRankRecords({
        profile,
        minRank: Math.max(1, Math.floor(rank * 0.95)),
        maxRank: Math.max(1, Math.floor(rank * 1.2)),
        take: 12,
      }),
      findRankRecords({
        profile,
        minRank: Math.max(1, Math.floor(rank * 1.2)),
        maxRank: Math.max(1, Math.floor(rank * 1.65)),
        take: 12,
      }),
    ]);

    return {
      chong: chong.map((item) => mapItem(item, profile, "chong")),
      wen: wen.map((item) => mapItem(item, profile, "wen")),
      bao: bao.map((item) => mapItem(item, profile, "bao")),
    };
  }

  const score = profile.score ?? 0;
  const [chong, wen, bao] = await Promise.all([
    findScoreRecords({
      profile,
      minScore: score + 1,
      maxScore: score + 25,
      take: 12,
      direction: "desc",
    }),
    findScoreRecords({
      profile,
      minScore: Math.max(0, score - 15),
      maxScore: score + 10,
      take: 12,
      direction: "desc",
    }),
    findScoreRecords({
      profile,
      minScore: Math.max(0, score - 45),
      maxScore: Math.max(0, score - 10),
      take: 12,
      direction: "desc",
    }),
  ]);

  return {
    chong: chong.map((item) => mapItem(item, profile, "chong")),
    wen: wen.map((item) => mapItem(item, profile, "wen")),
    bao: bao.map((item) => mapItem(item, profile, "bao")),
  };
}

function mapReport(report: GaokaoReport): GaokaoReportListItem {
  return {
    id: report.id,
    title: report.title,
    profile: report.profile as GaokaoProfile,
    recommendations: report.recommendations as GaokaoRecommendations,
    summary: report.summary,
    createdAt: report.created_at.toISOString(),
    sharePageUrl: buildResultSharePageUrl(
      "gaokao",
      report.id,
      signResultShareToken("gaokao", report.id),
    ),
  };
}

export async function listGaokaoReports(userId: string) {
  const reports = await prisma.gaokaoReport.findMany({
    where: { user_id: userId, deleted_at: null },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  return reports.map(mapReport);
}

export async function getUserGaokaoReport(userId: string, reportId: string) {
  const report = await prisma.gaokaoReport.findFirst({
    where: { id: reportId, user_id: userId, deleted_at: null },
  });

  return report ? mapReport(report) : null;
}

export async function getPublicGaokaoReport(reportId: string) {
  const report = await prisma.gaokaoReport.findFirst({
    where: { id: reportId, deleted_at: null },
  });

  return report ? mapReport(report) : null;
}

export async function createGaokaoReport(input: {
  userId: string;
  title: string;
  profile: GaokaoProfile;
  recommendations: GaokaoRecommendations;
  summary: string;
  submitIp: string;
  deviceId: string | null;
  userAgent: string;
}) {
  const report = await prisma.gaokaoReport.create({
    data: {
      user_id: input.userId,
      title: input.title,
      profile: input.profile,
      recommendations: input.recommendations,
      summary: input.summary,
      submit_ip: input.submitIp,
      device_id: input.deviceId,
      user_agent: input.userAgent,
    },
  });

  return mapReport(report);
}

export async function deleteGaokaoReport(userId: string, reportId: string) {
  const result = await prisma.gaokaoReport.updateMany({
    where: { id: reportId, user_id: userId },
    data: { deleted_at: new Date() },
  });

  return result.count > 0;
}
