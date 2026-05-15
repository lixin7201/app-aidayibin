import type { NextRequest } from "next/server";

import { requireStoredSessionFromRequest } from "@/features/auth/session";
import {
  getUserGenerationById,
  softDeleteUserGeneration,
} from "@/features/generation/generation-repository";
import { apiError, apiOk, AppError, errorCodes } from "@/lib/http/errors";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireStoredSessionFromRequest(request);
    const { id } = await params;
    const generation = await getUserGenerationById(user.id, id);

    if (!generation) {
      throw new AppError(errorCodes.TEMPLATE_NOT_FOUND, "记录不存在", 404);
    }

    return apiOk({ generation });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireStoredSessionFromRequest(request);
    const { id } = await params;
    const deleted = await softDeleteUserGeneration(user.id, id);

    if (!deleted) {
      throw new AppError(errorCodes.UNKNOWN_ERROR, "删除失败", 500);
    }

    return apiOk({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
