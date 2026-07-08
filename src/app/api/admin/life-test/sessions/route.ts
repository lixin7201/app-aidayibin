import type { NextRequest } from "next/server";

import { requireAdminRequest } from "@/features/admin/require-admin";
import { listLifeTestAdminSessions } from "@/features/life-test/life-test-service";
import { apiError, apiOk } from "@/lib/http/errors";

export async function GET(request: NextRequest) {
  try {
    requireAdminRequest(request);
    return apiOk({ sessions: await listLifeTestAdminSessions() });
  } catch (error) {
    return apiError(error);
  }
}
