import { getStoredSessionFromCookies } from "@/features/auth/session";
import { listUserFortuneGenerations } from "@/features/fortune/fortune-repository";
import { getFortuneQuotaSnapshot } from "@/features/fortune/fortune-quota-service";
import { FortunePageApp } from "@/features/fortune/fortune-app";

export default async function FortunePage() {
  const user = await getStoredSessionFromCookies();
  const [quota, generations] = await Promise.all([
    user
      ? getFortuneQuotaSnapshot(user)
      : Promise.resolve({
          dailyLimit: 2,
          dailySuccessCount: 0,
          dailyRemaining: 0,
          campaignLimit: 20,
          campaignSuccessCount: 0,
          campaignRemaining: 0,
          dailySubmitLimit: 5,
          dailySubmitCount: 0,
          hasRunningTask: false,
          platformDailyLimit: 3000,
          platformDailySuccessCount: 0,
          platformDailyRemaining: 3000,
          isUnlimited: false,
        }),
    user ? listUserFortuneGenerations(user.id) : Promise.resolve([]),
  ]);

  return (
    <FortunePageApp initialQuota={quota} initialGenerations={generations} />
  );
}
