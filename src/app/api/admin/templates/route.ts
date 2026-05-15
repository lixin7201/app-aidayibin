import type { NextRequest } from "next/server";

import { requireAdminRequest } from "@/features/admin/require-admin";
import { seedDefaultTemplates } from "@/features/templates/template-repository";
import { listTemplates } from "@/features/templates/template-repository";
import { apiError, apiOk } from "@/lib/http/errors";

export async function GET(request: NextRequest) {
  try {
    requireAdminRequest(request);
    const templates = await listTemplates({ includeInactive: true });
    return apiOk({ templates });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdminRequest(request);
    const result = await seedDefaultTemplates();
    return apiOk(result);
  } catch (error) {
    return apiError(error);
  }
}
