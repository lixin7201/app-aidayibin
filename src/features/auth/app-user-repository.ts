import type { SessionUser } from "@/features/auth/session";
import type { AppUserRecord } from "@/lib/db/database.types";
import { prisma } from "@/lib/db/prisma";
import { toAppUserRecord } from "@/lib/db/records";
import { AppError, errorCodes } from "@/lib/http/errors";

export async function ensureSessionUser(
  user: SessionUser,
): Promise<SessionUser> {
  const now = new Date();

  try {
    const data = await prisma.appUser.upsert({
      where: { app_user_id: user.appUserId },
      create: {
        app_user_id: user.appUserId,
        nickname: user.nickname,
        avatar_url: user.avatarUrl,
        last_seen_at: now,
      },
      update: {
        nickname: user.nickname,
        avatar_url: user.avatarUrl,
        last_seen_at: now,
      },
    });

    return mapAppUserToSession(toAppUserRecord(data), user.deviceId);
  } catch (error) {
    throw new AppError(
      errorCodes.UNKNOWN_ERROR,
      `用户信息保存失败：${getErrorMessage(error)}`,
      500,
    );
  }
}

function mapAppUserToSession(
  user: AppUserRecord,
  deviceId: string | null,
): SessionUser {
  return {
    id: user.id,
    appUserId: user.app_user_id,
    nickname: user.nickname ?? "大宜宾用户",
    avatarUrl: user.avatar_url,
    deviceId,
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "未知错误";
}
