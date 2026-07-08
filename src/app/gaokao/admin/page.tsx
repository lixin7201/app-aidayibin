import { redirect } from "next/navigation";

import { getStoredSessionFromCookies } from "@/features/auth/session";
import { isGaokaoAdminAppUserId } from "@/features/gaokao/gaokao-admin-auth";
import {
  getGaokaoAdminOverview,
  listGaokaoAdminAuditLogs,
  listGaokaoAdminUsers,
} from "@/features/gaokao/gaokao-admin-service";
import { GaokaoAdminConsole } from "@/features/gaokao/gaokao-admin-console";
import { appPath } from "@/lib/routes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GaokaoAdminPage() {
  const user = await getStoredSessionFromCookies();

  if (!user || !isGaokaoAdminAppUserId(user.appUserId)) {
    redirect(appPath("/gaokao"));
  }

  const [overview, users, auditLogs] = await Promise.all([
    getGaokaoAdminOverview(),
    listGaokaoAdminUsers(),
    listGaokaoAdminAuditLogs(),
  ]);

  return (
    <GaokaoAdminConsole
      admin={{
        nickname: user.nickname,
        appUserId: user.appUserId,
      }}
      initialOverview={overview}
      initialUsers={users}
      initialAuditLogs={auditLogs}
    />
  );
}
