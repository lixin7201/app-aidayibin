import type { NextRequest } from "next/server";

import { getAdminSessionFromRequest } from "@/features/admin/admin-session";
import { AppError, errorCodes } from "@/lib/http/errors";

export function requireAdminRequest(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    throw new AppError(errorCodes.UNAUTHORIZED, "管理员未登录", 401);
  }

  return session;
}
