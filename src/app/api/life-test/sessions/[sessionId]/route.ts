import type { NextRequest } from "next/server";

import { getLifeTestSession } from "@/features/life-test/life-test-service";
import { apiError, apiOk } from "@/lib/http/errors";

type RouteParams = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const session = await getLifeTestSession(sessionId);

    return apiOk({ session });
  } catch (error) {
    return apiError(error);
  }
}
