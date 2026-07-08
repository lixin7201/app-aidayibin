import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/features/auth/session";
import { lifeTestEventSchema } from "@/features/life-test/life-test-schemas";
import { recordLifeTestEvent } from "@/features/life-test/life-test-service";
import { apiError, apiOk } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/request";

export async function POST(request: NextRequest) {
  try {
    const user = getSessionFromRequest(request);
    const payload = lifeTestEventSchema.parse(await parseJsonBody(request));
    await recordLifeTestEvent({
      user,
      sessionId: payload.sessionId,
      eventName: payload.eventName,
      eventData: payload.eventData,
      source: payload.source,
      campaign: payload.campaign,
      campaignId: payload.campaignId,
      entryScene: payload.entryScene,
      channel: payload.channel,
      regionCode: payload.regionCode,
      shareCode: payload.shareCode,
      referrerSessionId: payload.referrerSessionId,
      posterVariant: payload.posterVariant,
    });

    return apiOk({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
