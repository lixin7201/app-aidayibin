import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/features/auth/session";
import { createLifeTestSessionSchema } from "@/features/life-test/life-test-schemas";
import { createLifeTestSession } from "@/features/life-test/life-test-service";
import { apiError, apiOk } from "@/lib/http/errors";
import { getClientIp, getUserAgent, parseJsonBody } from "@/lib/http/request";

export async function POST(request: NextRequest) {
  try {
    const user = getSessionFromRequest(request);
    const payload = createLifeTestSessionSchema.parse(await parseJsonBody(request));
    const session = await createLifeTestSession({
      user,
      anonymousId: payload.anonymousId,
      source: payload.source,
      campaign: payload.campaign,
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return apiOk({ session });
  } catch (error) {
    return apiError(error);
  }
}
