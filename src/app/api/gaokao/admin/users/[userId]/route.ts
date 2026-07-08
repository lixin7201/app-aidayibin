import type { NextRequest } from "next/server";

import { requireGaokaoAdminRequest } from "@/features/gaokao/gaokao-admin-auth";
import { getGaokaoAdminUserDetail } from "@/features/gaokao/gaokao-admin-service";
import { apiError, apiOk } from "@/lib/http/errors";

type RouteParams = {
  params: Promise<{ userId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireGaokaoAdminRequest(request);
    const { userId } = await params;
    const detail = await getGaokaoAdminUserDetail(userId);

    return apiOk(detail);
  } catch (error) {
    return apiError(error);
  }
}
