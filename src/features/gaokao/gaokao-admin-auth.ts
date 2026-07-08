import type { NextRequest } from "next/server";

import type { SessionUser } from "@/features/auth/session";
import { config } from "@/lib/config";
import { AppError, errorCodes } from "@/lib/http/errors";

const builtInGaokaoAdminAppUserIds = new Set(["734275", "10"]);

function configuredAdminAppUserIds() {
  return (config.GAOKAO_ADMIN_APP_USER_IDS ?? "")
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isGaokaoAdminAppUserId(appUserId: string | null | undefined) {
  if (!appUserId) {
    return false;
  }

  return (
    builtInGaokaoAdminAppUserIds.has(appUserId) ||
    configuredAdminAppUserIds().includes(appUserId)
  );
}

export function getGaokaoAdminRole(appUserId: string) {
  return appUserId === "734275" ? "owner" : "admin";
}

export async function requireGaokaoAdminRequest(
  request: NextRequest,
): Promise<SessionUser & { adminRole: "owner" | "admin" }> {
  const { requireStoredSessionFromRequest } = await import(
    "@/features/auth/session"
  );
  const user = await requireStoredSessionFromRequest(request);

  if (!isGaokaoAdminAppUserId(user.appUserId)) {
    throw new AppError(errorCodes.UNAUTHORIZED, "无管理员权限", 403);
  }

  return {
    ...user,
    adminRole: getGaokaoAdminRole(user.appUserId),
  };
}
