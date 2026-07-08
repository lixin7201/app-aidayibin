import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/features/auth/session";
import { createLifeTestLeadSchema } from "@/features/life-test/life-test-schemas";
import { createLifeTestLead } from "@/features/life-test/life-test-service";
import { apiError, apiOk } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/request";

export async function POST(request: NextRequest) {
  try {
    const user = getSessionFromRequest(request);
    const payload = createLifeTestLeadSchema.parse(await parseJsonBody(request));
    const lead = await createLifeTestLead({
      user,
      sessionId: payload.sessionId,
      leadType: payload.leadType,
      name: payload.name,
      mobile: payload.mobile,
      wechat: payload.wechat,
      note: payload.note,
      consent: payload.consent,
      source: payload.source,
      campaign: payload.campaign,
    });

    return apiOk({ leadId: lead.id });
  } catch (error) {
    return apiError(error);
  }
}
