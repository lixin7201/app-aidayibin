import type { NextRequest } from "next/server";

import {
  listAdminFortuneGenerations,
  listAdminGenerations,
} from "@/features/admin/admin-service";
import { requireAdminRequest } from "@/features/admin/require-admin";
import { apiError, apiOk } from "@/lib/http/errors";

export async function GET(request: NextRequest) {
  try {
    requireAdminRequest(request);
    const [generations, fortuneGenerations] = await Promise.all([
      listAdminGenerations(),
      listAdminFortuneGenerations(),
    ]);
    return apiOk({ generations, fortune_generations: fortuneGenerations });
  } catch (error) {
    return apiError(error);
  }
}
