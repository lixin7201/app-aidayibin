import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/features/auth/session";
import { apiOk } from "@/lib/http/errors";

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  return apiOk({
    user: {
      id: session.id,
      nickname: session.nickname,
      avatar_url: session.avatarUrl,
    },
  });
}
