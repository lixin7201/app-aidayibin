import type { NextRequest } from "next/server";

import { requireStoredSessionFromRequest } from "@/features/auth/session";
import { gaokaoRecommendSchema } from "@/features/gaokao/gaokao-schemas";
import { getGaokaoRecommendations } from "@/features/gaokao/gaokao-service";
import { apiError, apiOk } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/request";
import { assertRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const user = await requireStoredSessionFromRequest(request);

    await assertRateLimit(`gaokao_recommend:user:${user.id}`, {
      window: "1m",
      maxRequests: 6,
    });

    const payload = gaokaoRecommendSchema.parse(await parseJsonBody(request));
    const result = await getGaokaoRecommendations(payload.profile);

    return apiOk(result);
  } catch (error) {
    return apiError(error);
  }
}
