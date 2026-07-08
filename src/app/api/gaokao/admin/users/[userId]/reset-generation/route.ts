import type { NextRequest } from "next/server";

import { requireGaokaoAdminRequest } from "@/features/gaokao/gaokao-admin-auth";
import { resetGaokaoUserGeneration } from "@/features/gaokao/gaokao-admin-service";
import { apiError, apiOk } from "@/lib/http/errors";

type RouteParams = {
  params: Promise<{ userId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireGaokaoAdminRequest(request);
    const { userId } = await params;
    const detail = await resetGaokaoUserGeneration({ admin, userId });

    return apiOk(detail);
  } catch (error) {
    return apiError(error);
  }
}
