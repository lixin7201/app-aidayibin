import { formatInTimeZone } from "date-fns-tz";

import type { SessionUser } from "@/features/auth/session";
import { syncPendingGenerationTasks } from "@/features/generation/generation-sync";
import { isMockEnabled } from "@/lib/config";
import { prisma } from "@/lib/db/prisma";
import { AppError, errorCodes } from "@/lib/http/errors";

export type QuotaSnapshot = {
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

type SystemLimits = {
  dailySuccessLimitPerUser: number;
  campaignSuccessLimitPerUser: number;
  dailySubmitLimitPerUser: number;
  dailyPlatformSuccessLimit: number;
  featureEnabled: boolean;
};

const localTestingLimit = 999999;

const defaultLimits: SystemLimits = {
  dailySuccessLimitPerUser: 2,
  campaignSuccessLimitPerUser: 10,
  dailySubmitLimitPerUser: 5,
  dailyPlatformSuccessLimit: 3000,
  featureEnabled: true,
};

export function getBeijingDate(date = new Date()) {
  return formatInTimeZone(date, "Asia/Shanghai", "yyyy-MM-dd");
}

export async function getSystemLimits(): Promise<SystemLimits> {
  const data = await prisma.systemConfig.findMany({
    select: { key: true, value: true },
  });

  return data.reduce<SystemLimits>((limits, item) => {
    if (item.key === "daily_success_limit_per_user") {
      limits.dailySuccessLimitPerUser = Number(item.value) || 2;
    }

    if (item.key === "campaign_success_limit_per_user") {
      limits.campaignSuccessLimitPerUser = Number(item.value) || 10;
    }

    if (item.key === "daily_submit_limit_per_user") {
      limits.dailySubmitLimitPerUser = Number(item.value) || 5;
    }

    if (item.key === "daily_platform_success_limit") {
      limits.dailyPlatformSuccessLimit = Number(item.value) || 3000;
    }

    if (item.key === "feature_enabled") {
      limits.featureEnabled = item.value === true || item.value === "true";
    }

    return limits;
  }, defaultLimits);
}

export async function getQuotaSnapshot(
  user: SessionUser,
): Promise<QuotaSnapshot> {
  const limits = await getSystemLimits();

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

  await syncPendingGenerationTasks({ userId: user.id });

  const usageDate = getBeijingDate();
  const start = new Date(`${usageDate}T00:00:00+08:00`);

  const [
    dailySuccessCount,
    dailySubmitCount,
    campaignSuccessCount,
    runningTaskCount,
    platformDailySuccessCount,
  ] = await Promise.all([
    prisma.generationTask.count({
      where: {
        user_id: user.id,
        status: "succeeded",
        counts_quota: true,
        completed_at: { gte: start },
        deleted_at: null,
      },
    }),
    prisma.generationTask.count({
      where: {
        user_id: user.id,
        created_at: { gte: start },
        deleted_at: null,
      },
    }),
    prisma.generationTask.count({
      where: {
        user_id: user.id,
        status: "succeeded",
        counts_quota: true,
        deleted_at: null,
      },
    }),
    prisma.generationTask.count({
      where: {
        user_id: user.id,
        status: { in: ["pending", "processing"] },
        deleted_at: null,
      },
    }),
    prisma.generationTask.count({
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

export async function assertCanCreateGeneration(user: SessionUser) {
  const limits = await getSystemLimits();

  if (isMockEnabled) {
    return getQuotaSnapshot(user);
  }

  if (!limits.featureEnabled) {
    throw new AppError(
      errorCodes.PLATFORM_LIMIT_REACHED,
      "AI 写真暂时维护中，请稍后再试",
    );
  }

  const quota = await getQuotaSnapshot(user);

  if (quota.hasRunningTask) {
    throw new AppError(
      errorCodes.RUNNING_TASK_EXISTS,
      "你已有一张图片正在生成，请稍后查看",
    );
  }

  if (quota.dailyRemaining <= 0) {
    throw new AppError(
      errorCodes.DAILY_LIMIT_REACHED,
      "今天的体验次数已用完，明天再来试试",
    );
  }

  if (quota.campaignRemaining <= 0) {
    throw new AppError(
      errorCodes.CAMPAIGN_LIMIT_REACHED,
      "本次活动体验次数已用完",
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
      "今日体验名额已满，请明天再来试试",
    );
  }

  return quota;
}

export async function incrementSubmitCount(userId: string) {
  const usageDate = getBeijingDate();
  await prisma.dailyUsage.upsert({
    where: { user_id_usage_date: { user_id: userId, usage_date: usageDate } },
    create: {
      user_id: userId,
      usage_date: usageDate,
      submit_count: 1,
    },
    update: {
      submit_count: { increment: 1 },
    },
  });
}

export async function incrementSuccessCount(userId: string) {
  const usageDate = getBeijingDate();
  await prisma.dailyUsage.upsert({
    where: { user_id_usage_date: { user_id: userId, usage_date: usageDate } },
    create: {
      user_id: userId,
      usage_date: usageDate,
      success_count: 1,
    },
    update: {
      success_count: { increment: 1 },
    },
  });
}

export async function incrementFailedCount(userId: string) {
  const usageDate = getBeijingDate();
  await prisma.dailyUsage.upsert({
    where: { user_id_usage_date: { user_id: userId, usage_date: usageDate } },
    create: {
      user_id: userId,
      usage_date: usageDate,
      failed_count: 1,
    },
    update: {
      failed_count: { increment: 1 },
    },
  });
}
