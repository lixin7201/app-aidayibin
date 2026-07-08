import type { NextRequest } from "next/server";

import { requireGaokaoAdminRequest } from "@/features/gaokao/gaokao-admin-auth";
import { getGaokaoAdminOverview } from "@/features/gaokao/gaokao-admin-service";
import { apiError, apiOk } from "@/lib/http/errors";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireGaokaoAdminRequest(request);
    const overview = await getGaokaoAdminOverview();

    return apiOk({
      admin: {
        nickname: admin.nickname,
        appUserId: admin.appUserId,
        role: admin.adminRole,
      },
      overview,
    });
  } catch (error) {
    return apiError(error);
  }
}
