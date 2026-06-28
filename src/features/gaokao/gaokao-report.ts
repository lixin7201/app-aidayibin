import type {
  GaokaoDataStatus,
  GaokaoProfile,
  GaokaoRecommendationItem,
  GaokaoRecommendations,
} from "@/features/gaokao/types";

export type GaokaoReportContent = {
  title: string;
  headline: string;
  studentSnapshot: {
    name: string;
    subjectType: string;
    optionalSubjects: string[];
    score: number | null;
    rank: number | null;
  };
  candidateProfile: string[];
  advisorReferences: string[];
  tradeoffNotes: string[];
  conditionRisks: string[];
  strategySummary: string[];
  riskNotes: string[];
  nextActions: string[];
  disclaimer: string;
};

function countRecommendations(recommendations: GaokaoRecommendations) {
  return (
    recommendations.chong.length +
    recommendations.wen.length +
    recommendations.bao.length
  );
}

function firstSchool(items: GaokaoRecommendationItem[]) {
  return items[0]?.schoolName ?? "暂无";
}

function formatList(values: string[], fallback = "未明确") {
  return values.length > 0 ? values.join("、") : fallback;
}

function formatSubjectSelection(profile: GaokaoProfile) {
  return [
    profile.firstChoiceSubject,
    ...profile.optionalSubjects,
  ]
    .filter(Boolean)
    .join(" + ");
}

function formatAcceptance(value: boolean | null, label: string) {
  if (value === true) {
    return `接受${label}`;
  }

  if (value === false) {
    return `不接受${label}`;
  }

  return `${label}未明确`;
}

function splitNotes(notes: string | null) {
  return (notes ?? "")
    .split(/\n+/)
    .map((item) => cleanLegacyMarkdown(item))
    .filter(Boolean)
    .slice(-4);
}

function hasMajorGroupOnly(recommendations: GaokaoRecommendations) {
  return Object.values(recommendations)
    .flat()
    .some((item) => item.majorName?.includes("专业组"));
}

export function cleanLegacyMarkdown(value: string) {
  return value
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    .replace(/^\s*\|?[\s:|-]{3,}\|?\s*$/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildGaokaoReportContent(input: {
  profile: GaokaoProfile;
  recommendations: GaokaoRecommendations;
  dataStatus?: GaokaoDataStatus;
}): GaokaoReportContent {
  const { profile, recommendations } = input;
  const total = countRecommendations(recommendations);
  const name = profile.studentName ?? "考生";
  const subjectSelection = formatSubjectSelection(profile);
  const advisorNotes = splitNotes(profile.notes);
  const headline =
    input.dataStatus?.missingSichuanData
      ? "当前还没有导入四川历史投档数据，暂不能负责任地给出正式冲稳保名单。"
      : total > 0
        ? `按当前位次，建议主攻稳档，冲档控制数量，保底留足安全垫。`
        : "当前条件下候选不足，需要先放宽筛选条件再做正式填报判断。";
  const groupNote = hasMajorGroupOnly(recommendations)
    ? "当前四川数据多为院校专业组，组内具体专业必须以 2026 招生计划核对。"
    : "若院校专业组内有多个专业，仍需核对 2026 招生计划和调剂范围。";

  return {
    title: `${name}的四川高考志愿初筛报告`,
    headline,
    studentSnapshot: {
      name,
      subjectType: profile.subjectType ?? "未确认",
      optionalSubjects: profile.optionalSubjects,
      score: profile.score,
      rank: profile.rank,
    },
    candidateProfile: [
      `${name}，四川${profile.subjectType ?? "科类未确认"}${subjectSelection ? `，${subjectSelection}` : ""}。`,
      `成绩信息：${profile.score ? `${profile.score} 分` : "分数未填"}，${profile.rank ? `全省位次 ${profile.rank}` : "位次未填"}。`,
      `风险偏好：${profile.riskPreference === "aggressive" ? "偏冲" : profile.riskPreference === "safe" ? "稳妥" : "均衡"}。`,
    ],
    advisorReferences: [
      `专业偏好：${formatList(profile.preferredMajors)}；明确不想读：${formatList(profile.rejectedMajors)}。`,
      `城市偏好：${formatList(profile.preferredCities)}；明确不想去：${formatList(profile.rejectedCities)}。`,
      `学费预算：${profile.tuitionLimit ? `每年约 ${profile.tuitionLimit} 元以内` : "未明确"}。`,
      ...advisorNotes.map((note) => `顾问提醒：${note}`),
    ],
    tradeoffNotes: [
      profile.preferredMajors.length > 0
        ? `专业优先时，先核对 ${formatList(profile.preferredMajors)} 在候选院校里的具体专业组和转专业政策。`
        : "专业方向还不够明确，建议先排除坚决不读的方向，再从稳档学校里反推专业。",
      profile.preferredCities.length > 0
        ? `城市偏好会影响生活成本和实习机会，但不能把位次明显不匹配的学校硬拉进稳档。`
        : "城市暂未明确时，先按位次和专业匹配做大池子，再做地域取舍。",
      `冲档看学校和专业上限，稳档看匹配度，保底看是否真能接受，三档不要互相替代。`,
    ],
    conditionRisks: [
      `${formatAcceptance(profile.acceptPrivate, "民办")}；若不接受，民办相关候选需要从最终志愿表剔除。`,
      `${formatAcceptance(profile.acceptSinoForeign, "中外合作")}；需重点核对学费、培养地点和毕业证说明。`,
      `${formatAcceptance(profile.acceptAdjustment, "调剂")}；不服从调剂会增加退档风险，服从也要看组内专业范围。`,
    ],
    strategySummary: [
      `本轮筛到 ${total} 条候选：冲 ${recommendations.chong.length} 条、稳 ${recommendations.wen.length} 条、保 ${recommendations.bao.length} 条。`,
      `冲档可少量尝试，例如 ${firstSchool(recommendations.chong)}；稳档是主阵地，例如 ${firstSchool(recommendations.wen)}；保底用于降低滑档风险，例如 ${firstSchool(recommendations.bao)}。`,
      groupNote,
    ],
    riskNotes: [
      input.dataStatus?.missingSichuanData
        ? "四川历史投档数据未导入前，不应编造学校名单。"
        : "本轮候选来自已导入的四川历史投档数据。",
      "2026 四川成绩和位次已发布，但 2026 录取结果尚未产生；本报告只能参考 2025/2024 等历史投档和 2026 招生计划。",
      "AI 不承诺录取概率，不新增数据库以外的学校名单。",
      "专业偏好只参与排序，不会把位次匹配的候选一刀切删空。",
    ],
    nextActions: [
      "先核对每个院校专业组的 2026 招生计划、选科要求、学费和校区。",
      "把稳档作为志愿表骨架，冲档控制数量，保底不要只看学校名。",
      "若资料填错，可删除首次报告后重生成一次；第二次删除后需要联系大宜宾客服重置。",
    ],
    disclaimer: "结果仅供参考，正式填报以四川省教育考试院、阳光高考平台和高校招生章程为准。",
  };
}

export function serializeGaokaoReportContent(content: GaokaoReportContent) {
  return JSON.stringify(content);
}

function arrayOrFallback(value: unknown, fallback: string[]) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : fallback;
}

function isReportContent(value: unknown): value is GaokaoReportContent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<GaokaoReportContent>;
  return (
    typeof candidate.title === "string" &&
    typeof candidate.headline === "string" &&
    Array.isArray(candidate.strategySummary) &&
    Array.isArray(candidate.riskNotes) &&
    Array.isArray(candidate.nextActions) &&
    typeof candidate.disclaimer === "string"
  );
}

function normalizeReportContent(
  value: GaokaoReportContent,
  input: {
    profile: GaokaoProfile;
    recommendations: GaokaoRecommendations;
  },
) {
  const fallback = buildGaokaoReportContent(input);
  const candidate = value as Partial<GaokaoReportContent>;

  return {
    ...fallback,
    ...candidate,
    studentSnapshot: {
      ...fallback.studentSnapshot,
      ...(candidate.studentSnapshot ?? {}),
    },
    candidateProfile: arrayOrFallback(
      candidate.candidateProfile,
      fallback.candidateProfile,
    ),
    advisorReferences: arrayOrFallback(
      candidate.advisorReferences,
      fallback.advisorReferences,
    ),
    tradeoffNotes: arrayOrFallback(candidate.tradeoffNotes, fallback.tradeoffNotes),
    conditionRisks: arrayOrFallback(
      candidate.conditionRisks,
      fallback.conditionRisks,
    ),
    strategySummary: arrayOrFallback(
      candidate.strategySummary,
      fallback.strategySummary,
    ),
    riskNotes: arrayOrFallback(candidate.riskNotes, fallback.riskNotes),
    nextActions: arrayOrFallback(candidate.nextActions, fallback.nextActions),
  };
}

export function parseGaokaoReportContent(input: {
  summary: string;
  profile: GaokaoProfile;
  recommendations: GaokaoRecommendations;
}): GaokaoReportContent {
  try {
    const parsed = JSON.parse(input.summary) as unknown;
    if (isReportContent(parsed)) {
      return normalizeReportContent(parsed, input);
    }
  } catch {
    // Legacy reports were free text.
  }

  const fallback = buildGaokaoReportContent(input);
  return {
    ...fallback,
    strategySummary: [cleanLegacyMarkdown(input.summary)].filter(Boolean),
  };
}
