import type { NextRequest } from "next/server";

import { requireStoredSessionFromRequest } from "@/features/auth/session";
import { createGenerationSchema } from "@/features/generation/generation-schemas";
import { listUserGenerations } from "@/features/generation/generation-repository";
import { submitGeneration } from "@/features/generation/generation-service";
import { apiError, apiOk } from "@/lib/http/errors";
import { getClientIp, getUserAgent, parseJsonBody } from "@/lib/http/request";
import { assertRateLimit } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const user = await requireStoredSessionFromRequest(request);
    const generations = await listUserGenerations(user.id);

    return apiOk({ generations });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireStoredSessionFromRequest(request);

    await assertRateLimit(`generations:user:${user.id}`, {
      window: "1m",
      maxRequests: 3,
    });

    const payload = createGenerationSchema.parse(await parseJsonBody(request));
    const result = await submitGeneration({
      user,
      payload,
      submitIp: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return apiOk({
      task_id: result.taskId,
      status: result.status,
    });
  } catch (error) {
    return apiError(error);
  }
}
