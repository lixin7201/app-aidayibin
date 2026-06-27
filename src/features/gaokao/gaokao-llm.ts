import type {
  GaokaoDataStatus,
  GaokaoProfile,
  GaokaoRecommendations,
} from "@/features/gaokao/types";
import { config } from "@/lib/config";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function hasLlmConfig() {
  return Boolean(
    config.GAOKAO_LLM_BASE_URL &&
      config.GAOKAO_LLM_API_KEY &&
      config.GAOKAO_LLM_MODEL,
  );
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
  const llm = await callGaokaoLlm([
    {
      role: "system",
      content:
        "你是大宜宾高考填报 AI 助手，只服务四川考生。语气专业、清楚、略幽默。你只能追问或解释用户画像，不能编造学校、分数线、录取概率。",
    },
    {
      role: "user",
      content: JSON.stringify({
        userMessage: input.userMessage,
        extractedProfile: input.profile,
        fallbackQuestion: input.fallbackQuestion,
      }),
    },
  ]);

  return llm ?? input.fallbackQuestion;
}

export async function generateGaokaoReportSummary(input: {
  profile: GaokaoProfile;
  recommendations: GaokaoRecommendations;
  dataStatus: GaokaoDataStatus;
}) {
  const fallback = buildFallbackGaokaoSummary(input);
  const model = config.GAOKAO_LLM_REPORT_MODEL || config.GAOKAO_LLM_MODEL;
  const llm = await callGaokaoLlm(
    [
      {
        role: "system",
        content:
          "你是大宜宾高考填报 AI 助手。基于已给出的数据库推荐结果写一份四川考生志愿初筛报告。不得新增学校，不得编造分数、位次、录取承诺。语言专业、家长能看懂，可以有轻微幽默。",
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
    model,
  );

  return llm ?? fallback;
}
