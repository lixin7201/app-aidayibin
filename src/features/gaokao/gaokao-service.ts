import type { SessionUser } from "@/features/auth/session";
import {
  generateGaokaoAssistantReply,
  generateGaokaoReportSummary,
} from "@/features/gaokao/gaokao-llm";
import {
  buildGaokaoRecommendations,
  completeGaokaoProfileFromReferenceData,
  createGaokaoReport,
  getGaokaoDataStatus,
} from "@/features/gaokao/gaokao-repository";
import {
  buildNextGaokaoQuestion,
  getMissingGaokaoFields,
  mergeGaokaoProfile,
} from "@/features/gaokao/gaokao-profile";
import type {
  GaokaoProfile,
  GaokaoRecommendations,
} from "@/features/gaokao/types";
import { AppError, errorCodes } from "@/lib/http/errors";

function getReportTitle(profile: GaokaoProfile) {
  const subject = profile.subjectType ?? "四川考生";
  const rank = profile.rank ? `位次${profile.rank}` : null;
  const score = profile.score ? `${profile.score}分` : null;
  return `四川${subject}志愿初筛报告${rank ? ` - ${rank}` : score ? ` - ${score}` : ""}`;
}

export async function continueGaokaoChat(input: {
  message: string;
  profile?: Partial<GaokaoProfile>;
}) {
  const profile = mergeGaokaoProfile(input.profile, input.message);
  const missingFields = getMissingGaokaoFields(profile);
  const fallbackQuestion = buildNextGaokaoQuestion(profile);
  const [assistantMessage, dataStatus] = await Promise.all([
    generateGaokaoAssistantReply({
      userMessage: input.message,
      profile,
      fallbackQuestion,
    }),
    getGaokaoDataStatus(),
  ]);

  return {
    profile,
    missingFields,
    assistantMessage,
    dataStatus,
  };
}

export async function getGaokaoRecommendations(profile: GaokaoProfile) {
  const completedProfile = await completeGaokaoProfileFromReferenceData(profile);
  const dataStatus = await getGaokaoDataStatus();
  const missingFields = getMissingGaokaoFields(completedProfile);

  if (missingFields.includes("科类") || missingFields.includes("分数或位次")) {
    throw new AppError(
      errorCodes.INVALID_GAOKAO_PROFILE,
      `还缺少：${missingFields.join("、")}`,
    );
  }

  const recommendations = await buildGaokaoRecommendations(completedProfile);
  const summary = await generateGaokaoReportSummary({
    profile: completedProfile,
    recommendations,
    dataStatus,
  });

  return {
    dataStatus,
    profile: completedProfile,
    recommendations,
    summary,
  };
}

export async function saveGaokaoReport(input: {
  user: SessionUser;
  title?: string;
  profile: GaokaoProfile;
  recommendations: GaokaoRecommendations;
  summary: string;
  submitIp: string;
  userAgent: string;
}) {
  return createGaokaoReport({
    userId: input.user.id,
    title: input.title || getReportTitle(input.profile),
    profile: input.profile,
    recommendations: input.recommendations,
    summary: input.summary,
    submitIp: input.submitIp,
    deviceId: input.user.deviceId,
    userAgent: input.userAgent,
  });
}
