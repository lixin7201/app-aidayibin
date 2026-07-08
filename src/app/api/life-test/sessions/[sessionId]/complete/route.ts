import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/features/auth/session";
import { completeLifeTestSessionSchema } from "@/features/life-test/life-test-schemas";
import { completeLifeTestSession } from "@/features/life-test/life-test-service";
import { apiError, apiOk } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/request";

type RouteParams = {
  params: Promise<{ sessionId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const user = getSessionFromRequest(request);
    const payload = completeLifeTestSessionSchema.parse(await parseJsonBody(request));
    const session = await completeLifeTestSession({
      sessionId,
      answers: payload.answers,
      user,
    });

    return apiOk({ session });
  } catch (error) {
    return apiError(error);
  }
}
