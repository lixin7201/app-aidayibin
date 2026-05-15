import type { NextRequest } from "next/server";

import { requireStoredSessionFromRequest } from "@/features/auth/session";
import { getQuotaSnapshot } from "@/features/quota/quota-service";
import { apiError, apiOk } from "@/lib/http/errors";

export async function GET(request: NextRequest) {
  try {
    const user = await requireStoredSessionFromRequest(request);
    const quota = await getQuotaSnapshot(user);

    return apiOk({ quota });
  } catch (error) {
    return apiError(error);
  }
}
