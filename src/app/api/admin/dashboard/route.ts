import type { NextRequest } from "next/server";

import { getAdminDashboard } from "@/features/admin/admin-service";
import { requireAdminRequest } from "@/features/admin/require-admin";
import { apiError, apiOk } from "@/lib/http/errors";

export async function GET(request: NextRequest) {
  try {
    requireAdminRequest(request);
    const dashboard = await getAdminDashboard();
    return apiOk(dashboard);
  } catch (error) {
    return apiError(error);
  }
}
