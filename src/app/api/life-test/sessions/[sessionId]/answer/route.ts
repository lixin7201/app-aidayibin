import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/features/auth/session";
import { saveLifeTestAnswerSchema } from "@/features/life-test/life-test-schemas";
import { saveLifeTestAnswer } from "@/features/life-test/life-test-service";
import { apiError, apiOk } from "@/lib/http/errors";
import { getClientIp, parseJsonBody } from "@/lib/http/request";
import { assertRateLimit } from "@/lib/security/rate-limit";

type RouteParams = {
  params: Promise<{ sessionId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const user = getSessionFromRequest(request);
    const payload = saveLifeTestAnswerSchema.parse(await parseJsonBody(request));
    await assertRateLimit(`life_test_answer:ip:${getClientIp(request)}`, {
      window: "1m",
      maxRequests: 60,
    });
    const result = await saveLifeTestAnswer({
      sessionId,
      answer: {
        questionId: payload.questionId,
        optionId: payload.optionId,
      },
      user,
      writeToken: payload.writeToken,
    });

    return apiOk(result);
  } catch (error) {
    return apiError(error);
  }
}
