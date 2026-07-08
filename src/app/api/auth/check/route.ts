import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/features/auth/session";
import { isGaokaoAdminAppUserId } from "@/features/gaokao/gaokao-admin-auth";
import { apiOk } from "@/lib/http/errors";

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  return apiOk({
    user: {
      id: session.id,
      app_user_id: session.appUserId,
      nickname: session.nickname,
      avatar_url: session.avatarUrl,
      is_gaokao_admin: isGaokaoAdminAppUserId(session.appUserId),
    },
  });
}
