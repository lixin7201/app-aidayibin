import type { NextRequest } from "next/server";

import { requireStoredSessionFromRequest } from "@/features/auth/session";
import { gaokaoChatSchema } from "@/features/gaokao/gaokao-schemas";
import { continueGaokaoChat } from "@/features/gaokao/gaokao-service";
import { apiError, apiOk } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/request";
import { assertRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const user = await requireStoredSessionFromRequest(request);

    await assertRateLimit(`gaokao_chat:user:${user.id}`, {
      window: "1m",
      maxRequests: 12,
    });

    const payload = gaokaoChatSchema.parse(await parseJsonBody(request));
    const result = await continueGaokaoChat(payload);

    return apiOk(result);
  } catch (error) {
    return apiError(error);
  }
}
