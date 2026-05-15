import { clearAdminSession } from "@/features/admin/admin-session";
import { apiOk } from "@/lib/http/errors";

export async function POST() {
  await clearAdminSession();
  return apiOk({ ok: true });
}
