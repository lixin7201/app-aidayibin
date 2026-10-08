import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/features/auth/session";
import { getLifeTestSession } from "@/features/life-test/life-test-service";
import { apiError, apiOk } from "@/lib/http/errors";

type RouteParams = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const session = await getLifeTestSession(sessionId, {
      user: getSessionFromRequest(request),
      writeToken: request.headers.get("x-life-test-write-token"),
    });

    return apiOk({ session });
  } catch (error) {
    return apiError(error);
  }
}
