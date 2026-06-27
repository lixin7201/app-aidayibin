import type { SessionUser } from "@/features/auth/session";
import { syncPendingFortuneTasks } from "@/features/fortune/fortune-sync";
import { getBeijingDate } from "@/features/quota/quota-service";
import { isMockEnabled } from "@/lib/config";
import { prisma } from "@/lib/db/prisma";
import { AppError, errorCodes } from "@/lib/http/errors";

export type FortuneQuotaSnapshot = {
  dailyLimit: number;
  dailySuccessCount: number;
  dailyRemaining: number;
  campaignLimit: number;
  campaignSuccessCount: number;
  campaignRemaining: number;
  dailySubmitLimit: number;
  dailySubmitCount: number;
  hasRunningTask: boolean;
  platformDailyLimit: number;
  platformDailySuccessCount: number;
  platformDailyRemaining: number;
  isUnlimited: boolean;
};

type FortuneLimits = {
  dailySuccessLimitPerUser: number;
  campaignSuccessLimitPerUser: number;
  dailySubmitLimitPerUser: number;
  dailyPlatformSuccessLimit: number;
  featureEnabled: boolean;
  palmEnabled: boolean;
  faceEnabled: boolean;
};

const localTestingLimit = 999999;

const defaultLimits: FortuneLimits = {
  dailySuccessLimitPerUser: 1,
  campaignSuccessLimitPerUser: 1,
  dailySubmitLimitPerUser: 5,
  dailyPlatformSuccessLimit: 3000,
  featureEnabled: true,
  palmEnabled: true,
  faceEnabled: true,
};

export async function getFortuneSystemLimits(): Promise<FortuneLimits> {
  const data = await prisma.systemConfig.findMany({
    select: { key: true, value: true },
  });

  return data.reduce<FortuneLimits>((limits, item) => {
    if (item.key === "fortune_lifetime_success_limit_per_user") {
      const nextLimit = Math.min(Number(item.value) || 1, 1);
      limits.dailySuccessLimitPerUser = nextLimit;
      limits.campaignSuccessLimitPerUser = nextLimit;
    }

    if (item.key === "fortune_daily_success_limit_per_user") {
      const nextLimit = Math.min(Number(item.value) || 1, 1);
      limits.dailySuccessLimitPerUser = nextLimit;
      limits.campaignSuccessLimitPerUser = nextLimit;
    }

    if (item.key === "fortune_campaign_success_limit_per_user") {
      const nextLimit = Math.min(Number(item.value) || 1, 1);
      limits.dailySuccessLimitPerUser = nextLimit;
      limits.campaignSuccessLimitPerUser = nextLimit;
    }

    if (item.key === "fortune_daily_submit_limit_per_user") {
      limits.dailySubmitLimitPerUser = Number(item.value) || 5;
    }

    if (item.key === "fortune_daily_platform_success_limit") {
      limits.dailyPlatformSuccessLimit = Number(item.value) || 3000;
    }

    if (item.key === "fortune_feature_enabled") {
      limits.featureEnabled = item.value === true || item.value === "true";
    }

    if (item.key === "fortune_palm_enabled") {
      limits.palmEnabled = item.value === true || item.value === "true";
    }

    if (item.key === "fortune_face_enabled") {
      limits.faceEnabled = item.value === true || item.value === "true";
    }

    return limits;
  }, defaultLimits);
}

export async function getFortuneQuotaSnapshot(
  user: SessionUser,
): Promise<FortuneQuotaSnapshot> {
  const limits = await getFortuneSystemLimits();

  if (isMockEnabled) {
    return {
      dailyLimit: localTestingLimit,
      dailySuccessCount: 0,
      dailyRemaining: localTestingLimit,
      campaignLimit: localTestingLimit,
      campaignSuccessCount: 0,
      campaignRemaining: localTestingLimit,
      dailySubmitLimit: localTestingLimit,
      dailySubmitCount: 0,
      hasRunningTask: false,
      platformDailyLimit: localTestingLimit,
      platformDailySuccessCount: 0,
      platformDailyRemaining: localTestingLimit,
      isUnlimited: true,
    };
  }

  await syncPendingFortuneTasks({ userId: user.id });

  const today = getBeijingDate();
  const start = new Date(`${today}T00:00:00+08:00`);
  const [
    dailySuccessCount,
    dailySubmitCount,
    campaignSuccessCount,
    runningTaskCount,
    platformDailySuccessCount,
  ] = await Promise.all([
    prisma.fortuneGenerationTask.count({
      where: {
        user_id: user.id,
        status: "succeeded",
        counts_quota: true,
        completed_at: { gte: start },
        deleted_at: null,
      },
    }),
    prisma.fortuneGenerationTask.count({
      where: {
        user_id: user.id,
        created_at: { gte: start },
        deleted_at: null,
      },
    }),
    prisma.fortuneGenerationTask.count({
      where: {
        user_id: user.id,
        status: "succeeded",
        counts_quota: true,
        deleted_at: null,
      },
    }),
    prisma.fortuneGenerationTask.count({
      where: {
        user_id: user.id,
        status: { in: ["pending", "processing"] },
        deleted_at: null,
      },
    }),
    prisma.fortuneGenerationTask.count({
      where: {
        status: "succeeded",
        counts_quota: true,
        completed_at: { gte: start },
      },
    }),
  ]);

  return {
    dailyLimit: limits.dailySuccessLimitPerUser,
    dailySuccessCount,
    dailyRemaining: Math.max(
      limits.dailySuccessLimitPerUser - dailySuccessCount,
      0,
    ),
    campaignLimit: limits.campaignSuccessLimitPerUser,
    campaignSuccessCount,
    campaignRemaining: Math.max(
      limits.campaignSuccessLimitPerUser - campaignSuccessCount,
      0,
    ),
    dailySubmitLimit: limits.dailySubmitLimitPerUser,
    dailySubmitCount,
    hasRunningTask: runningTaskCount > 0,
    platformDailyLimit: limits.dailyPlatformSuccessLimit,
    platformDailySuccessCount,
    platformDailyRemaining: Math.max(
      limits.dailyPlatformSuccessLimit - platformDailySuccessCount,
      0,
    ),
    isUnlimited: false,
  };
}

export async function assertCanCreateFortuneGeneration(
  user: SessionUser,
  type: "palm" | "face",
) {
  const limits = await getFortuneSystemLimits();

  if (isMockEnabled) {
    return getFortuneQuotaSnapshot(user);
  }

  if (!limits.featureEnabled) {
    throw new AppError(
      errorCodes.PLATFORM_LIMIT_REACHED,
      "AI 算命暂时维护中，请稍后再试",
    );
  }

  if (type === "palm" && !limits.palmEnabled) {
    throw new AppError(
      errorCodes.PLATFORM_LIMIT_REACHED,
      "AI 看手相暂时维护中，请稍后再试",
    );
  }

  if (type === "face" && !limits.faceEnabled) {
    throw new AppError(
      errorCodes.PLATFORM_LIMIT_REACHED,
      "AI 看面相暂时维护中，请稍后再试",
    );
  }

  const quota = await getFortuneQuotaSnapshot(user);

  if (quota.hasRunningTask) {
    throw new AppError(
      errorCodes.RUNNING_TASK_EXISTS,
      "你已有一张报告正在生成，请稍后查看",
    );
  }

  if (quota.campaignRemaining <= 0) {
    throw new AppError(
      errorCodes.CAMPAIGN_LIMIT_REACHED,
      "你已经生成过 AI 算命报告啦，快来邀请朋友一起测试吧",
    );
  }

  if (quota.dailySubmitCount >= quota.dailySubmitLimit) {
    throw new AppError(
      errorCodes.SUBMIT_TOO_FREQUENT,
      "今天提交次数较多，请明天再来试试",
    );
  }

  if (quota.platformDailyRemaining <= 0) {
    throw new AppError(
      errorCodes.PLATFORM_LIMIT_REACHED,
      "今日 AI 算命体验名额已满，请明天再来试试",
    );
  }

  return quota;
}
