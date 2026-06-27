import type { NextRequest } from "next/server";

import { requireStoredSessionFromRequest } from "@/features/auth/session";
import {
  deleteGaokaoReport,
  getUserGaokaoReport,
} from "@/features/gaokao/gaokao-repository";
import { apiError, apiOk, AppError, errorCodes } from "@/lib/http/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireStoredSessionFromRequest(request);
    const { id } = await params;
    const report = await getUserGaokaoReport(user.id, id);

    if (!report) {
      throw new AppError(errorCodes.UNKNOWN_ERROR, "报告不存在", 404);
    }

    return apiOk({ report });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireStoredSessionFromRequest(request);
    const { id } = await params;
    const deleted = await deleteGaokaoReport(user.id, id);

    return apiOk({ deleted });
  } catch (error) {
    return apiError(error);
  }
}
