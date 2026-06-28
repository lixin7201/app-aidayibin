import type {
  GaokaoDataStatus,
  GaokaoProfile,
  GaokaoRecommendations,
} from "@/features/gaokao/types";
import {
  buildGaokaoReportContent,
  serializeGaokaoReportContent,
} from "@/features/gaokao/gaokao-report";
import { config } from "@/lib/config";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const gaokaoBusinessFacts =
  "当前业务事实：今天按服务器日期处理；四川 2026 高考已结束；2026 普通高考物理类、历史类成绩分段统计表已于 2026-06-25 发布；2026 普通类按院校专业组填报，投档遵循位次优先、遵循志愿、一轮投档；2026 录取结果尚未产生，不能说已有 2026 录取位次或录取概率，只能参考 2025/2024 历史投档和 2026 成绩位次、招生计划。";

function hasLlmConfig() {
  return Boolean(
    config.GAOKAO_LLM_BASE_URL &&
      config.GAOKAO_LLM_API_KEY &&
      config.GAOKAO_LLM_MODEL,
  );
}

function formatList(values: string[], fallback: string) {
  return values.length > 0 ? values.join("、") : fallback;
}

function formatLocationPreference(profile: GaokaoProfile) {
  const preferred = [
    ...profile.preferredRegions.map((region) => `${region}优先`),
    ...profile.preferredSchoolProvinces,
    ...profile.preferredSchoolCities,
  ];
  const rejected = [
    ...profile.rejectedRegions,
    ...profile.rejectedSchoolProvinces.map((province) => `${province}省内院校`),
    ...profile.rejectedSchoolCities,
  ];

  return [
    preferred.length > 0 ? `地域偏好是 ${preferred.join("、")}` : null,
    rejected.length > 0 ? `明确排除 ${rejected.join("、")}` : null,
    profile.distancePreference === "province_outside"
      ? "省外优先"
      : profile.distancePreference === "far_from_home"
        ? "离家远一点"
        : null,
  ]
    .filter(Boolean)
    .join("，") || "地域偏好暂未明确";
}

function formatAdvisorCaseNotes(profile: GaokaoProfile) {
  return (profile.notes ?? "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter((item) => /^(顾问理解|顾问表达|顾问边界|安全提醒)/.test(item))
    .slice(-3);
}

function buildLocalAdvisorReply(input: {
  profile: GaokaoProfile;
  fallbackQuestion: string;
}) {
  const { profile } = input;
  const subject = [
    profile.firstChoiceSubject,
    ...profile.optionalSubjects,
  ].filter(Boolean);
  const confirmed = [
    profile.studentName ? `姓名 ${profile.studentName}` : null,
    subject.length > 0
      ? `科目 ${subject.join(" + ")}`
      : profile.subjectType
        ? `科类 ${profile.subjectType}`
        : null,
    profile.score ? `${profile.score} 分` : null,
  ]
    .filter(Boolean)
    .join("，");
  const hasEnoughScoreInfo = Boolean(profile.subjectType && (profile.rank || profile.score));
  const advisorCaseNotes = formatAdvisorCaseNotes(profile);

  return [
    `我先确认一下：${confirmed || "基础信息还没补齐"}。这些会直接进入后面的志愿初筛报告。`,
    hasEnoughScoreInfo
      ? `接下来会以四川${profile.subjectType ?? ""}${profile.rank ? "、系统定位的位次" : ""}为主线看冲稳保。专业偏好是 ${formatList(profile.preferredMajors, "暂未明确")}，城市偏好是 ${formatList(profile.preferredCities, "暂未明确")}，这些会影响排序，但不会替代位次判断。`
      : "志愿初筛最怕关键硬信息缺一块：科类、位次、分数至少要先对齐，后面谈专业和城市才不跑偏。",
    `我对地域的理解：${formatLocationPreference(profile)}。如果是硬排除，后面不会为了凑数量偷偷放回去。`,
    ...advisorCaseNotes,
    `风险上先记住三件事：民办、中外合作和调剂范围要提前确认；冲档不能当稳档；2026 录取结果还没产生，不能把历史投档当成承诺。`,
    input.fallbackQuestion,
  ].join("\n\n");
}

async function callGaokaoLlm(messages: ChatMessage[], model?: string) {
  if (!hasLlmConfig()) {
    return null;
  }

  const baseUrl = config.GAOKAO_LLM_BASE_URL?.replace(/\/+$/, "");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.GAOKAO_LLM_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: model ?? config.GAOKAO_LLM_MODEL,
      temperature: 0.35,
      messages,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return payload.choices?.[0]?.message?.content?.trim() || null;
}

export function buildFallbackGaokaoSummary(input: {
  profile: GaokaoProfile;
  recommendations: GaokaoRecommendations;
  dataStatus: GaokaoDataStatus;
}) {
  const total =
    input.recommendations.chong.length +
    input.recommendations.wen.length +
    input.recommendations.bao.length;

  if (input.dataStatus.missingSichuanData) {
    return [
      "当前系统还没有导入四川历史投档数据，所以我不能负责任地给出冲稳保学校名单。",
      "你现在可以先完成考生画像，等四川数据导入后再生成正式报告。志愿填报这事不能靠气氛组，数据没到位就硬报学校，容易把人带沟里。",
    ].join("\n\n");
  }

  if (total === 0) {
    return [
      "按当前条件没有筛到合适结果，建议放宽专业关键词、城市偏好，或者补充准确位次后再试。",
      "志愿初筛不是越窄越专业，第一轮先把池子打开，第二轮再砍掉不合适的。",
    ].join("\n\n");
  }

  return [
    `我按四川${input.profile.subjectType ?? ""}、位次 ${input.profile.rank ?? "未填"}、分数 ${input.profile.score ?? "未填"} 做了第一轮初筛。`,
    `当前筛到 ${total} 条候选，其中冲 ${input.recommendations.chong.length} 条、稳 ${input.recommendations.wen.length} 条、保 ${input.recommendations.bao.length} 条。冲刺项别当稳，保底项也别嫌弃，它们负责帮你把滑档风险按住。`,
    "下一步建议你重点比较：专业是否真想读、城市生活成本、学费压力、是否接受调剂，以及当年招生计划有没有变化。",
  ].join("\n\n");
}

export async function generateGaokaoAssistantReply(input: {
  userMessage: string;
  profile: GaokaoProfile;
  fallbackQuestion: string;
}) {
  const fallbackReply = buildLocalAdvisorReply({
    profile: input.profile,
    fallbackQuestion: input.fallbackQuestion,
  });
  const llm = await callGaokaoLlm([
    {
      role: "system",
      content: [
        "你是大宜宾高考填报 AI 助手，只服务四川考生。语气要直给、专业、就业导向，不绕弯，不营销。每次回复先确认用户刚补充的信息，再给 2-4 段具体分析，最后只问一个关键问题或提示可以生成报告。聊天阶段只能解释画像、约束、专业思路和取舍，不允许点名具体学校或专业组；正式学校名单只能由推荐接口根据数据库返回。不能编造学校、分数线、录取概率，不能承诺录取或就业。不要提及任何外部个人姓名。用户说远离四川、离家远、远离原生家庭时，要复述为学校所在地约束；用户说东北优先时，只能当地域偏好，除非他说只看或必须。",
        "回复必须是纯中文自然段落，不使用 Markdown 标题、加粗、分隔线、表格或项目符号。",
        gaokaoBusinessFacts,
      ].join("\n"),
    },
    {
      role: "user",
      content: JSON.stringify({
        userMessage: input.userMessage,
        extractedProfile: input.profile,
        fallbackQuestion: fallbackReply,
      }),
    },
  ]);

  return llm ?? fallbackReply;
}

export async function generateGaokaoReportSummary(input: {
  profile: GaokaoProfile;
  recommendations: GaokaoRecommendations;
  dataStatus: GaokaoDataStatus;
}) {
  return serializeGaokaoReportContent(buildGaokaoReportContent(input));
}
