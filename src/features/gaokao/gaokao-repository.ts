import type { GaokaoReport } from "@prisma/client";

import type {
  GaokaoDataStatus,
  GaokaoGenerationStatus,
  GaokaoMajorSuggestion,
  GaokaoProfile,
  GaokaoRecommendationBucket,
  GaokaoRecommendationItem,
  GaokaoRecommendations,
  GaokaoReportListItem,
  GaokaoSubjectType,
} from "@/features/gaokao/types";
import { createEmptyGaokaoProfile } from "@/features/gaokao/types";
import { signResultShareToken } from "@/lib/auth/result-share-token";
import { config } from "@/lib/config";
import { prisma } from "@/lib/db/prisma";
import {
  buildGaokaoReportCardImageUrl,
  buildResultSharePageUrl,
} from "@/lib/share/result-share";

function toSubjectType(value: string): GaokaoSubjectType {
  return /历史|文科/.test(value) ? "历史类" : "物理类";
}

function getRankGap(userRank: number | null, recordRank: number | null) {
  if (!userRank || !recordRank) {
    return null;
  }

  return recordRank - userRank;
}

function formatRankGapReason(rankGap: number | null) {
  if (rankGap === null) {
    return "该条记录有历史分数参考，但位次字段不完整";
  }

  if (rankGap > 0) {
    return `历史位次比你靠后 ${rankGap} 名左右`;
  }

  if (rankGap < 0) {
    return `历史位次比你靠前 ${Math.abs(rankGap)} 名左右`;
  }

  return "历史位次与你几乎持平";
}

function mapItem(
  record: ScoredAdmissionRecord,
  profile: GaokaoProfile,
  bucket: GaokaoRecommendationBucket,
): GaokaoRecommendationItem {
  const rankGap = getRankGap(profile.rank, record.rank);
  const riskLabel =
    bucket === "chong" ? "冲刺" : bucket === "wen" ? "相对匹配" : "兜底";
  const rankGapReason = formatRankGapReason(rankGap);
  const baseReason =
    rankGap === null
      ? `${rankGapReason}，建议结合招生计划二次核对。`
      : bucket === "chong"
        ? `${rankGapReason}，适合放在冲刺区，不建议当稳。`
        : bucket === "wen"
          ? `${rankGapReason}，适合重点比较专业和城市。`
          : `${rankGapReason}，主要用于降低滑档风险。`;
  const relaxedNote = record.relaxedRange ? "该档已放宽筛选范围。" : "";
  const groupNote = record.major_name?.includes("专业组")
    ? "组内具体专业需以 2026 招生计划核对。"
    : "";
  const reason = [relaxedNote, baseReason, groupNote].filter(Boolean).join("");

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

type AdmissionRecord = {
  id: string;
  school_name: string;
  major_name: string | null;
  year: number;
  subject_type: string;
  batch: string | null;
  score: number | null;
  rank: number | null;
  quota: number | null;
};

type ScoredAdmissionRecord = AdmissionRecord & {
  relaxedRange?: boolean;
};

type MajorPlanRow = {
  plan_type?: string | null;
  major_full_name?: string | null;
  major_name: string;
  major_note: string | null;
  other_note?: string | null;
  subject_requirement: string | null;
  plan_count: number | null;
  tuition: number | null;
  duration: string | null;
  estimated_rank_2026: number | null;
  rank_2025: number | null;
  group_rank_2025: number | null;
  group_major_count: number | null;
  group_cleanliness: number | null;
  is_new: boolean;
  major_category: string | null;
  major_class: string | null;
  major_rating: string | null;
  major_ranking: number | null;
  discipline_eval: string | null;
  major_level: string | null;
  school_tags?: string | null;
  school_type?: string | null;
  school_city: string | null;
  school_province: string | null;
  ownership: string | null;
};

type MajorPlanDelegate = {
  findMany: (args: {
    where: Record<string, unknown>;
    orderBy?: Array<Record<string, string>>;
    take?: number;
  }) => Promise<MajorPlanRow[]>;
};

const optionalSubjectValues = ["化学", "生物", "思想政治", "地理"] as const;
const recommendationTakeByBucket: Record<GaokaoRecommendationBucket, number> = {
  chong: 5,
  wen: 8,
  bao: 5,
};

function getRecordText(record: { school_name: string; major_name: string | null }) {
  return `${record.school_name} ${record.major_name ?? ""}`;
}

function getOptionalSubjectRequirement(text: string) {
  return text.match(/选科[：:\s]*([^）)；;]+)/)?.[1] ?? null;
}

function requirementIncludesSubject(
  requirement: string,
  subject: (typeof optionalSubjectValues)[number],
) {
  if (subject === "思想政治") {
    return requirement.includes("思想政治") || requirement.includes("政治");
  }

  return requirement.includes(subject);
}

function matchesOptionalSubjects(record: AdmissionRecord, profile: GaokaoProfile) {
  const requirement = getOptionalSubjectRequirement(getRecordText(record));

  if (!requirement || /不限/.test(requirement) || profile.optionalSubjects.length === 0) {
    return true;
  }

  const requiredSubjects = optionalSubjectValues.filter((subject) =>
    requirementIncludesSubject(requirement, subject),
  );

  return requiredSubjects.every((subject) => profile.optionalSubjects.includes(subject));
}

function getMajorPlanDelegate() {
  return (prisma as unknown as { gaokaoMajorPlan?: MajorPlanDelegate }).gaokaoMajorPlan;
}

function extractGroupCode(value: string | null) {
  if (!value) {
    return null;
  }

  return (
    value.match(/专业组\s*([A-Za-z0-9]+)/)?.[1] ??
    value.match(/[（(]([A-Za-z0-9]{2,4})[）)]/)?.[1] ??
    null
  );
}

function getMajorPlanText(row: MajorPlanRow) {
  return [
    row.plan_type,
    row.major_full_name,
    row.major_name,
    row.major_note,
    row.other_note,
    row.major_category,
    row.major_class,
    row.major_level,
    row.school_tags,
    row.school_type,
    row.school_city,
    row.school_province,
    row.ownership,
  ]
    .filter(Boolean)
    .join(" ");
}

function getMajorPlanRank(row: MajorPlanRow) {
  return row.estimated_rank_2026 ?? row.rank_2025 ?? row.group_rank_2025;
}

function matchesPlanOptionalSubjects(row: MajorPlanRow, profile: GaokaoProfile) {
  const requirement = row.subject_requirement ?? "";

  if (!requirement || /不限/.test(requirement) || profile.optionalSubjects.length === 0) {
    return true;
  }

  const requiredSubjects = optionalSubjectValues.filter((subject) =>
    requirementIncludesSubject(requirement, subject),
  );

  return requiredSubjects.every((subject) => profile.optionalSubjects.includes(subject));
}

function isMajorPlanRejected(row: MajorPlanRow, profile: GaokaoProfile) {
  const text = getMajorPlanText(row);

  if (profile.rejectedMajors.some((keyword) => text.includes(keyword))) {
    return true;
  }

  if (
    profile.rejectedCities.some((keyword) =>
      [row.school_city, row.school_province].some((value) => value?.includes(keyword)),
    )
  ) {
    return true;
  }

  if (profile.tuitionLimit && row.tuition && row.tuition > profile.tuitionLimit) {
    return true;
  }

  if (profile.acceptSinoForeign === false && /中外|合作办学/.test(text)) {
    return true;
  }

  if (profile.acceptPrivate === false && /民办|独立学院/.test(text)) {
    return true;
  }

  return !matchesPlanOptionalSubjects(row, profile);
}

function scoreMajorPlan(row: MajorPlanRow, profile: GaokaoProfile) {
  const text = getMajorPlanText(row);
  const rank = getMajorPlanRank(row);
  let score = 0;

  if (profile.preferredMajors.some((keyword) => text.includes(keyword))) {
    score += 120;
  }

  if (
    profile.preferredCities.some((keyword) =>
      [row.school_city, row.school_province].some((value) => value?.includes(keyword)),
    )
  ) {
    score += 30;
  }

  if (profile.rank && rank) {
    const distance = Math.abs(rank - profile.rank);
    score += Math.max(0, 90 - (distance / profile.rank) * 120);
  }

  if (row.plan_count) {
    score += Math.min(20, row.plan_count * 2);
  }

  if (row.major_rating || row.discipline_eval || row.major_level) {
    score += 20;
  }

  if (row.major_ranking && row.major_ranking <= 100) {
    score += 15;
  }

  if (row.group_cleanliness) {
    score += row.group_cleanliness <= 1
      ? row.group_cleanliness * 20
      : Math.min(20, row.group_cleanliness / 5);
  }

  return score;
}

function buildMajorFitReason(row: MajorPlanRow, profile: GaokaoProfile) {
  const text = getMajorPlanText(row);
  const preferred = profile.preferredMajors.find((keyword) => text.includes(keyword));

  if (preferred) {
    return `匹配你填写的专业偏好：${preferred}`;
  }

  if (row.estimated_rank_2026) {
    return `2026 预估位次 ${row.estimated_rank_2026}，可与当前位次对照`;
  }

  if (row.rank_2025) {
    return `2025 专业最低位次 ${row.rank_2025}，可作为历史参考`;
  }

  return "来自该院校专业组的 2026 官方招生计划";
}

function buildMajorRiskNote(row: MajorPlanRow, profile: GaokaoProfile) {
  const rank = getMajorPlanRank(row);
  const text = getMajorPlanText(row);
  const notes = [];

  if (profile.rank && rank && rank < profile.rank * 0.95) {
    notes.push("专业参考位次比当前位次更靠前，建议谨慎放入稳档。");
  }

  if (row.group_major_count && row.group_major_count >= 8) {
    notes.push("该专业组内专业较多，需确认是否能接受组内其他专业。");
  }

  if (row.is_new && !row.rank_2025) {
    notes.push("该专业为新增或缺少专业历史位次，需要结合同组位次判断。");
  }

  if (row.tuition && row.tuition >= 40_000) {
    notes.push("学费较高，需确认家庭预算和培养模式。");
  }

  if (/中外|合作办学/.test(text)) {
    notes.push("含合作办学信息，需核对学费、校区和毕业证说明。");
  }

  if (/民办|独立学院/.test(text)) {
    notes.push("院校性质需重点确认，避免和家庭预期不一致。");
  }

  return notes.join("") || null;
}

function mapMajorSuggestion(
  row: MajorPlanRow,
  profile: GaokaoProfile,
): GaokaoMajorSuggestion {
  return {
    majorName: row.major_name,
    majorNote: row.major_note,
    subjectRequirement: row.subject_requirement,
    planCount: row.plan_count,
    tuition: row.tuition,
    duration: row.duration,
    estimatedRank: row.estimated_rank_2026,
    previousRank: row.rank_2025,
    groupRank: row.group_rank_2025,
    fitReason: buildMajorFitReason(row, profile),
    riskNote: buildMajorRiskNote(row, profile),
  };
}

async function findMajorSuggestions(
  item: GaokaoRecommendationItem,
  profile: GaokaoProfile,
): Promise<GaokaoMajorSuggestion[]> {
  const majorPlan = getMajorPlanDelegate();

  if (!majorPlan) {
    return [];
  }

  const groupCode = extractGroupCode(item.majorName);
  const where: Record<string, unknown> = {
    year: 2026,
    province: "四川",
    subject_type: item.subjectType,
    school_name: item.schoolName,
  };

  if (groupCode) {
    where.group_code = groupCode;
  } else if (item.majorName) {
    where.OR = [
      { major_name: { contains: item.majorName } },
      { major_full_name: { contains: item.majorName } },
    ];
  }

  try {
    const rows = await majorPlan.findMany({
      where,
      orderBy: [
        { estimated_rank_2026: "asc" },
        { rank_2025: "asc" },
        { plan_count: "desc" },
      ],
      take: 80,
    });

    return rows
      .filter((row) => !isMajorPlanRejected(row, profile))
      .map((row) => ({
        row,
        score: scoreMajorPlan(row, profile),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ row }) => mapMajorSuggestion(row, profile));
  } catch {
    return [];
  }
}

async function attachMajorSuggestions(
  recommendations: GaokaoRecommendations,
  profile: GaokaoProfile,
): Promise<GaokaoRecommendations> {
  const [chong, wen, bao] = await Promise.all(
    (["chong", "wen", "bao"] as const).map(async (bucket) =>
      Promise.all(
        recommendations[bucket].map(async (item) => ({
          ...item,
          majorSuggestions: await findMajorSuggestions(item, profile),
        })),
      ),
    ),
  );

  return { chong, wen, bao };
}

function isHardRejected(record: AdmissionRecord, profile: GaokaoProfile) {
  const text = getRecordText(record);

  if (profile.rejectedMajors.some((keyword) => text.includes(keyword))) {
    return true;
  }

  if (profile.rejectedCities.some((keyword) => text.includes(keyword))) {
    return true;
  }

  if (profile.acceptSinoForeign === false && /中外|合作办学/.test(text)) {
    return true;
  }

  if (profile.acceptPrivate === false && /民办/.test(text)) {
    return true;
  }

  return !matchesOptionalSubjects(record, profile);
}

function scoreRecord(input: {
  record: AdmissionRecord;
  profile: GaokaoProfile;
  centerRank: number | null;
  centerScore: number | null;
}) {
  const { record, profile } = input;
  const text = getRecordText(record);
  let score = record.year;

  if (profile.batch && record.batch?.includes(profile.batch)) {
    score += 40;
  }

  if (profile.preferredMajors.some((keyword) => text.includes(keyword))) {
    score += 90;
  }

  if (profile.preferredCities.some((keyword) => text.includes(keyword))) {
    score += 60;
  }

  if (input.centerRank && record.rank) {
    const distance = Math.abs(record.rank - input.centerRank);
    score += Math.max(0, 80 - (distance / input.centerRank) * 120);
  }

  if (input.centerScore && record.score) {
    const distance = Math.abs(record.score - input.centerScore);
    score += Math.max(0, 50 - distance * 2);
  }

  return score;
}

function pickPreferredRecords(input: {
  rows: AdmissionRecord[];
  profile: GaokaoProfile;
  take: number;
  centerRank: number | null;
  centerScore: number | null;
  relaxedRange?: boolean;
}): ScoredAdmissionRecord[] {
  return input.rows
    .filter((record) => !isHardRejected(record, input.profile))
    .map((record) => ({
      ...record,
      relaxedRange: input.relaxedRange,
      sortScore: scoreRecord({
        record,
        profile: input.profile,
        centerRank: input.centerRank,
        centerScore: input.centerScore,
      }),
    }))
    .sort((a, b) => b.sortScore - a.sortScore)
    .slice(0, input.take)
    .map((record) => ({
      id: record.id,
      school_name: record.school_name,
      major_name: record.major_name,
      year: record.year,
      subject_type: record.subject_type,
      batch: record.batch,
      score: record.score,
      rank: record.rank,
      quota: record.quota,
      relaxedRange: record.relaxedRange,
    }));
}

async function findRankRecords(input: {
  profile: GaokaoProfile;
  minRank: number;
  maxRank: number;
  take: number;
}) {
  const centerRank = Math.max(1, Math.floor((input.minRank + input.maxRank) / 2));
  const ranges = [
    { minRank: input.minRank, maxRank: input.maxRank, relaxedRange: false },
    {
      minRank: Math.max(1, Math.floor(input.minRank * 0.82)),
      maxRank: Math.max(input.maxRank, Math.floor(input.maxRank * 1.22)),
      relaxedRange: true,
    },
  ];
  let best: ScoredAdmissionRecord[] = [];

  for (const range of ranges) {
    const rows = await prisma.gaokaoAdmissionRecord.findMany({
      where: {
        province: "四川",
        subject_type: input.profile.subjectType ?? undefined,
        rank: {
          gte: range.minRank,
          lte: range.maxRank,
        },
      },
      orderBy: [{ year: "desc" }, { rank: "asc" }],
      take: input.take * 10,
    });
    const picked = pickPreferredRecords({
      rows,
      profile: input.profile,
      take: input.take,
      centerRank,
      centerScore: null,
      relaxedRange: range.relaxedRange,
    });

    if (picked.length > best.length) {
      best = picked;
    }

    if (picked.length >= Math.min(3, input.take)) {
      return picked;
    }
  }

  return best;
}

async function findScoreRecords(input: {
  profile: GaokaoProfile;
  minScore: number;
  maxScore: number;
  take: number;
  direction: "asc" | "desc";
}) {
  const centerScore = Math.max(0, Math.floor((input.minScore + input.maxScore) / 2));
  const ranges = [
    { minScore: input.minScore, maxScore: input.maxScore, relaxedRange: false },
    {
      minScore: Math.max(0, input.minScore - 25),
      maxScore: Math.min(750, input.maxScore + 25),
      relaxedRange: true,
    },
  ];
  let best: ScoredAdmissionRecord[] = [];

  for (const range of ranges) {
    const rows = await prisma.gaokaoAdmissionRecord.findMany({
      where: {
        province: "四川",
        subject_type: input.profile.subjectType ?? undefined,
        score: {
          gte: range.minScore,
          lte: range.maxScore,
        },
      },
      orderBy: [{ year: "desc" }, { score: input.direction }],
      take: input.take * 10,
    });
    const picked = pickPreferredRecords({
      rows,
      profile: input.profile,
      take: input.take,
      centerRank: null,
      centerScore,
      relaxedRange: range.relaxedRange,
    });

    if (picked.length > best.length) {
      best = picked;
    }

    if (picked.length >= Math.min(3, input.take)) {
      return picked;
    }
  }

  return best;
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
        take: recommendationTakeByBucket.chong,
      }),
      findRankRecords({
        profile,
        minRank: Math.max(1, Math.floor(rank * 0.95)),
        maxRank: Math.max(1, Math.floor(rank * 1.2)),
        take: recommendationTakeByBucket.wen,
      }),
      findRankRecords({
        profile,
        minRank: Math.max(1, Math.floor(rank * 1.2)),
        maxRank: Math.max(1, Math.floor(rank * 1.65)),
        take: recommendationTakeByBucket.bao,
      }),
    ]);

    const recommendations = {
      chong: chong.map((item) => mapItem(item, profile, "chong")),
      wen: wen.map((item) => mapItem(item, profile, "wen")),
      bao: bao.map((item) => mapItem(item, profile, "bao")),
    };

    if (
      profile.score &&
      recommendations.chong.length +
        recommendations.wen.length +
        recommendations.bao.length ===
        0
    ) {
      return buildScoreRecommendations(profile);
    }

    return attachMajorSuggestions(recommendations, profile);
  }

  return buildScoreRecommendations(profile);
}

async function buildScoreRecommendations(
  profile: GaokaoProfile,
): Promise<GaokaoRecommendations> {
  const empty = { chong: [], wen: [], bao: [] };

  if (!profile.subjectType || !profile.score) {
    return empty;
  }

  const score = profile.score ?? 0;
  const [chong, wen, bao] = await Promise.all([
    findScoreRecords({
      profile,
      minScore: score + 1,
      maxScore: score + 25,
      take: recommendationTakeByBucket.chong,
      direction: "desc",
    }),
    findScoreRecords({
      profile,
      minScore: Math.max(0, score - 15),
      maxScore: score + 10,
      take: recommendationTakeByBucket.wen,
      direction: "desc",
    }),
    findScoreRecords({
      profile,
      minScore: Math.max(0, score - 45),
      maxScore: Math.max(0, score - 10),
      take: recommendationTakeByBucket.bao,
      direction: "desc",
    }),
  ]);

  return attachMajorSuggestions({
    chong: chong.map((item) => mapItem(item, profile, "chong")),
    wen: wen.map((item) => mapItem(item, profile, "wen")),
    bao: bao.map((item) => mapItem(item, profile, "bao")),
  }, profile);
}

function mapReport(report: GaokaoReport): GaokaoReportListItem {
  const shareToken = signResultShareToken("gaokao", report.id);
  const profile = {
    ...createEmptyGaokaoProfile(),
    ...(report.profile as Partial<GaokaoProfile>),
  };

  return {
    id: report.id,
    title: report.title,
    profile,
    recommendations: report.recommendations as GaokaoRecommendations,
    summary: report.summary,
    createdAt: report.created_at.toISOString(),
    sharePageUrl: buildResultSharePageUrl("gaokao", report.id, shareToken),
    shareImageUrl: buildGaokaoReportCardImageUrl(report.id, shareToken),
  };
}

function getGenerationMessage(input: {
  totalReports: number;
  activeReports: number;
  unlimited: boolean;
}) {
  if (input.unlimited) {
    return input.activeReports > 0
      ? "测试账号已开启不限次数生成。当前有报告，可查看、分享或删除后继续生成。"
      : "测试账号已开启不限次数生成，可以继续生成高考志愿初筛报告。";
  }

  if (input.activeReports > 0) {
    return "已生成报告，可查看、分享或删除后使用纠错重生成机会。";
  }

  if (input.totalReports >= 2) {
    return "本账号已用完本年度 AI 初筛机会，如确需重置请联系大宜宾客服。";
  }

  if (input.totalReports === 1) {
    return "首次报告已删除，还可以纠错重生成一次。";
  }

  return "本账号还未生成正式报告。";
}

const builtInUnlimitedGaokaoTestAppUserIds = new Set(["734275"]);

function isUnlimitedGaokaoTestUser(input: {
  userId: string;
  appUserId: string | null;
}) {
  const configuredIds = (config.GAOKAO_UNLIMITED_TEST_USER_IDS ?? "")
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    configuredIds.includes(input.userId) ||
    Boolean(input.appUserId && configuredIds.includes(input.appUserId)) ||
    Boolean(
      input.appUserId &&
        builtInUnlimitedGaokaoTestAppUserIds.has(input.appUserId),
    )
  );
}

export async function getGaokaoGenerationStatus(
  userId: string,
): Promise<GaokaoGenerationStatus> {
  const [totalReports, activeReports, user] = await Promise.all([
    prisma.gaokaoReport.count({ where: { user_id: userId } }),
    prisma.gaokaoReport.count({ where: { user_id: userId, deleted_at: null } }),
    prisma.appUser.findUnique({
      where: { id: userId },
      select: { app_user_id: true },
    }),
  ]);
  const unlimited = isUnlimitedGaokaoTestUser({
    userId,
    appUserId: user?.app_user_id ?? null,
  });

  return {
    totalReports,
    activeReports,
    deletedReports: Math.max(0, totalReports - activeReports),
    canGenerate: unlimited || (activeReports === 0 && totalReports < 2),
    isUnlimitedTestUser: unlimited,
    message: getGenerationMessage({ totalReports, activeReports, unlimited }),
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
