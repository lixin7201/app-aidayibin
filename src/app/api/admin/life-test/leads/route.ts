import type { NextRequest } from "next/server";

import { requireAdminRequest } from "@/features/admin/require-admin";
import { listLifeTestAdminLeads } from "@/features/life-test/life-test-service";
import { apiError, apiOk } from "@/lib/http/errors";

export async function GET(request: NextRequest) {
  try {
    requireAdminRequest(request);
    return apiOk({ leads: await listLifeTestAdminLeads() });
  } catch (error) {
    return apiError(error);
  }
}
