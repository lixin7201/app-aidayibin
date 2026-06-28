import { getStoredSessionFromCookies } from "@/features/auth/session";
import { GaokaoAssistantApp } from "@/features/gaokao/gaokao-app";
import {
  getGaokaoDataStatus,
  getGaokaoGenerationStatus,
  listGaokaoReports,
} from "@/features/gaokao/gaokao-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GaokaoPage() {
  const user = await getStoredSessionFromCookies();
  const [dataStatus, reports, generationStatus] = await Promise.all([
    getGaokaoDataStatus(),
    user ? listGaokaoReports(user.id) : Promise.resolve([]),
    user
      ? getGaokaoGenerationStatus(user.id)
      : Promise.resolve({
          totalReports: 0,
          activeReports: 0,
          deletedReports: 0,
          canGenerate: false,
          isUnlimitedTestUser: false,
          message: "请先登录大宜宾 App 后使用。",
        }),
  ]);

  return (
    <GaokaoAssistantApp
      currentUser={
        user
          ? {
              nickname: user.nickname,
              avatarUrl: user.avatarUrl,
            }
          : null
      }
      initialReports={reports}
      initialDataStatus={dataStatus}
      initialGenerationStatus={generationStatus}
    />
  );
}
