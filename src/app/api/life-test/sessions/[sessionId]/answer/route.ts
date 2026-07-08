import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/features/auth/session";
import { lifeTestAnswerSchema } from "@/features/life-test/life-test-schemas";
import { saveLifeTestAnswer } from "@/features/life-test/life-test-service";
import { apiError, apiOk } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/request";

type RouteParams = {
  params: Promise<{ sessionId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const user = getSessionFromRequest(request);
    const answer = lifeTestAnswerSchema.parse(await parseJsonBody(request));
    const result = await saveLifeTestAnswer({ sessionId, answer, user });

    return apiOk(result);
  } catch (error) {
    return apiError(error);
  }
}
