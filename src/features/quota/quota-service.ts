import { formatInTimeZone } from "date-fns-tz";

import type { SessionUser } from "@/features/auth/session";
import { syncPendingGenerationTasks } from "@/features/generation/generation-sync";
import { isMockEnabled } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/db/supabase";
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
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return defaultLimits;
  }

  const { data } = await supabase.from("system_configs").select("key,value");

  if (!data) {
    return defaultLimits;
  }

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
      limits.featureEnabled = Boolean(item.value);
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

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return {
      dailyLimit: limits.dailySuccessLimitPerUser,
      dailySuccessCount: 0,
      dailyRemaining: limits.dailySuccessLimitPerUser,
      campaignLimit: limits.campaignSuccessLimitPerUser,
      campaignSuccessCount: 0,
      campaignRemaining: limits.campaignSuccessLimitPerUser,
      dailySubmitLimit: limits.dailySubmitLimitPerUser,
      dailySubmitCount: 0,
      hasRunningTask: false,
      platformDailyLimit: limits.dailyPlatformSuccessLimit,
      platformDailySuccessCount: 0,
      platformDailyRemaining: limits.dailyPlatformSuccessLimit,
      isUnlimited: false,
    };
  }

  await syncPendingGenerationTasks({ userId: user.id });

  const usageDate = getBeijingDate();

  const [
    dailyUsageResult,
    campaignCountResult,
    runningTaskResult,
    platformCountResult,
  ] = await Promise.all([
    supabase
      .from("daily_usage")
      .select("success_count,submit_count")
      .eq("user_id", user.id)
      .eq("usage_date", usageDate)
      .maybeSingle(),
    supabase
      .from("generation_tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "succeeded")
      .eq("counts_quota", true)
      .is("deleted_at", null),
    supabase
      .from("generation_tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["pending", "processing"])
      .is("deleted_at", null),
    supabase
      .from("generation_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "succeeded")
      .eq("counts_quota", true)
      .gte(`${"completed_at"}`, `${usageDate}T00:00:00+08:00`),
  ]);

  const dailySuccessCount = dailyUsageResult.data?.success_count ?? 0;
  const dailySubmitCount = dailyUsageResult.data?.submit_count ?? 0;
  const campaignSuccessCount = campaignCountResult.count ?? 0;
  const platformDailySuccessCount = platformCountResult.count ?? 0;

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
    hasRunningTask: Boolean(runningTaskResult.count),
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
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return;
  }

  const usageDate = getBeijingDate();
  const { data } = await supabase
    .from("daily_usage")
    .select("submit_count")
    .eq("user_id", userId)
    .eq("usage_date", usageDate)
    .maybeSingle();

  await supabase.from("daily_usage").upsert(
    {
      user_id: userId,
      usage_date: usageDate,
      submit_count: (data?.submit_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,usage_date" },
  );
}

export async function incrementSuccessCount(userId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return;
  }

  const usageDate = getBeijingDate();
  const { data } = await supabase
    .from("daily_usage")
    .select("success_count")
    .eq("user_id", userId)
    .eq("usage_date", usageDate)
    .maybeSingle();

  await supabase.from("daily_usage").upsert(
    {
      user_id: userId,
      usage_date: usageDate,
      success_count: (data?.success_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,usage_date" },
  );
}

export async function incrementFailedCount(userId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return;
  }

  const usageDate = getBeijingDate();
  const { data } = await supabase
    .from("daily_usage")
    .select("failed_count")
    .eq("user_id", userId)
    .eq("usage_date", usageDate)
    .maybeSingle();

  await supabase.from("daily_usage").upsert(
    {
      user_id: userId,
      usage_date: usageDate,
      failed_count: (data?.failed_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,usage_date" },
  );
}
