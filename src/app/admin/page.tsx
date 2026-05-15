import { redirect } from "next/navigation";

import {
  getAdminDashboard,
  listAdminFortuneGenerations,
  listAdminGenerations,
} from "@/features/admin/admin-service";
import { getAdminSessionFromCookies } from "@/features/admin/admin-session";
import { AdminDashboard } from "@/features/admin/admin-dashboard";
import { listTemplates } from "@/features/templates/template-repository";
import { appPath } from "@/lib/routes";

export default async function AdminPage() {
  const session = await getAdminSessionFromCookies();

  if (!session) {
    redirect(appPath("/admin/login"));
  }

  const [dashboard, templates, generations, fortuneGenerations] =
    await Promise.all([
    getAdminDashboard(),
    listTemplates({ includeInactive: true }),
    listAdminGenerations(),
    listAdminFortuneGenerations(),
  ]);

  return (
    <AdminDashboard
      initialDashboard={dashboard}
      initialTemplates={templates}
      initialGenerations={generations}
      initialFortuneGenerations={fortuneGenerations}
    />
  );
}
