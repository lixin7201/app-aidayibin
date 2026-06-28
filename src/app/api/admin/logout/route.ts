import { clearAdminSession } from "@/features/admin/admin-session";
import { apiOk } from "@/lib/http/errors";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  await clearAdminSession(request);
  return apiOk({ ok: true });
}
