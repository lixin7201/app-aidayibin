import type { SessionUser } from "@/features/auth/session";
import {
  callGaokaoAdvisorEngine,
  type GaokaoAdvisorResult,
} from "@/features/gaokao/gaokao-advisor-engine";
import {
  generateGaokaoAssistantReply,
  generateGaokaoReportSummary,
} from "@/features/gaokao/gaokao-llm";
import {
  buildGaokaoRecommendations,
  completeGaokaoProfileFromReferenceData,
  createGaokaoReport,
  getGaokaoGenerationStatus,
  getGaokaoDataStatus,
} from "@/features/gaokao/gaokao-repository";
import {
  buildNextGaokaoQuestion,
  getMissingGaokaoFields,
  mergeGaokaoProfile,
} from "@/features/gaokao/gaokao-profile";
import { cleanLegacyMarkdown } from "@/features/gaokao/gaokao-report";
import type {
  GaokaoProfile,
  GaokaoRecommendations,
} from "@/features/gaokao/types";
import { AppError, errorCodes } from "@/lib/http/errors";

const advisorProfilePatchFields = [
  "preferredMajors",
  "rejectedMajors",
  "preferredCities",
  "rejectedCities",
  "preferredRegions",
  "rejectedRegions",
  "preferredSchoolProvinces",
  "rejectedSchoolProvinces",
  "preferredSchoolCities",
  "rejectedSchoolCities",
  "distancePreference",
  "locationStrictness",
  "riskPreference",
  "tuitionLimit",
  "acceptPrivate",
  "acceptSinoForeign",
  "acceptAdjustment",
  "notes",
] as const;

function getReportTitle(profile: GaokaoProfile) {
  const subject = profile.subjectType ?? "四川考生";
  const name = profile.studentName ? `${profile.studentName} ` : "";
  const rank = profile.rank ? `位次${profile.rank}` : null;
  const score = profile.score ? `${profile.score}分` : null;
  return `${name}四川${subject}志愿初筛报告${rank ? ` - ${rank}` : score ? ` - ${score}` : ""}`;
}

function cleanGaokaoChatText(value: string) {
  return cleanLegacyMarkdown(value)
    .replace(/张雪峰|张老师|峰哥/g, "直给顾问口吻")
    .replace(/保证录取|包录取|100%|百分百|一定能上/g, "录取承诺")
    .replace(/\*\*/g, "")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function mergeTextNotes(
  current: string | null | undefined,
  next: Array<string | null | undefined>,
) {
  const notes = [current, ...next]
    .flatMap((item) => item?.split(/\n+/) ?? [])
    .map((item) => cleanGaokaoChatText(item))
    .filter(Boolean);

  return Array.from(new Set(notes)).join("\n").slice(-1000) || null;
}

function pickAdvisorProfilePatch(
  patch: Partial<GaokaoProfile>,
): Partial<GaokaoProfile> {
  const safePatch: Partial<GaokaoProfile> = {};

  for (const field of advisorProfilePatchFields) {
    if (Object.prototype.hasOwnProperty.call(patch, field)) {
      (safePatch as Record<string, unknown>)[field] = patch[field];
    }
  }

  return safePatch;
}

function mergeUniqueValues(current: string[], next: string[] | undefined) {
  return Array.from(new Set([...current, ...(next ?? [])]));
}

function applyAdvisorResult(
  profile: GaokaoProfile,
  result: GaokaoAdvisorResult,
): GaokaoProfile {
  const safePatch = pickAdvisorProfilePatch(result.profilePatch);
  const patched = {
    ...profile,
    ...safePatch,
    preferredMajors: mergeUniqueValues(profile.preferredMajors, safePatch.preferredMajors),
    rejectedMajors: mergeUniqueValues(profile.rejectedMajors, safePatch.rejectedMajors),
    preferredCities: mergeUniqueValues(profile.preferredCities, safePatch.preferredCities),
    rejectedCities: mergeUniqueValues(profile.rejectedCities, safePatch.rejectedCities),
    preferredRegions: mergeUniqueValues(profile.preferredRegions, safePatch.preferredRegions),
    rejectedRegions: mergeUniqueValues(profile.rejectedRegions, safePatch.rejectedRegions),
    preferredSchoolProvinces: mergeUniqueValues(
      profile.preferredSchoolProvinces,
      safePatch.preferredSchoolProvinces,
    ),
    rejectedSchoolProvinces: mergeUniqueValues(
      profile.rejectedSchoolProvinces,
      safePatch.rejectedSchoolProvinces,
    ),
    preferredSchoolCities: mergeUniqueValues(
      profile.preferredSchoolCities,
      safePatch.preferredSchoolCities,
    ),
    rejectedSchoolCities: mergeUniqueValues(
      profile.rejectedSchoolCities,
      safePatch.rejectedSchoolCities,
    ),
  };

  return {
    ...patched,
    notes: mergeTextNotes(profile.notes, [safePatch.notes, ...result.advisorNotes]),
  };
}

async function assertCanGenerate(userId: string) {
  const status = await getGaokaoGenerationStatus(userId);

  if (!status.canGenerate) {
    throw new AppError(
      errorCodes.PLATFORM_LIMIT_REACHED,
      status.message,
      429,
    );
  }

  return status;
}

export async function continueGaokaoChat(input: {
  message: string;
  profile?: Partial<GaokaoProfile>;
}) {
  let profile = mergeGaokaoProfile(input.profile, input.message);
  profile = await completeGaokaoProfileFromReferenceData(profile);
  const [advisorResult, dataStatus] = await Promise.all([
    callGaokaoAdvisorEngine({
      userMessage: input.message,
      profile,
    }),
    getGaokaoDataStatus(),
  ]);

  if (advisorResult) {
    profile = applyAdvisorResult(profile, advisorResult);
    profile = await completeGaokaoProfileFromReferenceData(profile);
  }

  const missingFields = getMissingGaokaoFields(profile);
  const fallbackQuestion = buildNextGaokaoQuestion(profile);
  const assistantMessage =
    advisorResult?.reply ??
    (await generateGaokaoAssistantReply({
      userMessage: input.message,
      profile,
      fallbackQuestion,
    }));

  return {
    profile,
    missingFields,
    assistantMessage: cleanGaokaoChatText(assistantMessage),
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
  await assertCanGenerate(input.user.id);

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

export async function generateAndSaveGaokaoReport(input: {
  user: SessionUser;
  profile: GaokaoProfile;
  submitIp: string;
  userAgent: string;
}) {
  await assertCanGenerate(input.user.id);

  const result = await getGaokaoRecommendations(input.profile);
  const report = await createGaokaoReport({
    userId: input.user.id,
    title: getReportTitle(result.profile),
    profile: result.profile,
    recommendations: result.recommendations,
    summary: result.summary,
    submitIp: input.submitIp,
    deviceId: input.user.deviceId,
    userAgent: input.userAgent,
  });
  const generationStatus = await getGaokaoGenerationStatus(input.user.id);

  return {
    ...result,
    report,
    generationStatus,
  };
}

export { getGaokaoGenerationStatus };
