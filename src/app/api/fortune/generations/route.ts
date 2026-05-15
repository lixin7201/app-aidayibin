import type { NextRequest } from "next/server";

import { requireStoredSessionFromRequest } from "@/features/auth/session";
import { createFortuneGenerationSchema } from "@/features/fortune/fortune-schemas";
import { listUserFortuneGenerations } from "@/features/fortune/fortune-repository";
import { getFortuneQuotaSnapshot } from "@/features/fortune/fortune-quota-service";
import { submitFortuneGeneration } from "@/features/fortune/fortune-service";
import { apiError, apiOk } from "@/lib/http/errors";
import { getClientIp, getUserAgent, parseJsonBody } from "@/lib/http/request";

export async function GET(request: NextRequest) {
  try {
    const user = await requireStoredSessionFromRequest(request);
    const [generations, quota] = await Promise.all([
      listUserFortuneGenerations(user.id),
      getFortuneQuotaSnapshot(user),
    ]);

    return apiOk({ generations, quota });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireStoredSessionFromRequest(request);
    const payload = createFortuneGenerationSchema.parse(
      await parseJsonBody(request),
    );
    const result = await submitFortuneGeneration({
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
