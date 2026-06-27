import { getStoredSessionFromCookies } from "@/features/auth/session";
import { GaokaoAssistantApp } from "@/features/gaokao/gaokao-app";
import {
  getGaokaoDataStatus,
  listGaokaoReports,
} from "@/features/gaokao/gaokao-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GaokaoPage() {
  const user = await getStoredSessionFromCookies();
  const [dataStatus, reports] = await Promise.all([
    getGaokaoDataStatus(),
    user ? listGaokaoReports(user.id) : Promise.resolve([]),
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
    />
  );
}
