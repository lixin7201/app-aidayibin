import type { NextRequest } from "next/server";

import { requireGaokaoAdminRequest } from "@/features/gaokao/gaokao-admin-auth";
import { listGaokaoAdminAuditLogs } from "@/features/gaokao/gaokao-admin-service";
import { apiError, apiOk } from "@/lib/http/errors";

export async function GET(request: NextRequest) {
  try {
    await requireGaokaoAdminRequest(request);
    const logs = await listGaokaoAdminAuditLogs();

    return apiOk({ logs });
  } catch (error) {
    return apiError(error);
  }
}
