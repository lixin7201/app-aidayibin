import type { SessionUser } from "@/features/auth/session";
import type { AppUserRecord } from "@/lib/db/database.types";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { AppError, errorCodes } from "@/lib/http/errors";

export async function ensureSessionUser(
  user: SessionUser,
): Promise<SessionUser> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return user;
  }

  const now = new Date().toISOString();
  const { data: existingUser, error: selectError } = await supabase
    .from("app_users")
    .select("*")
    .eq("app_user_id", user.appUserId)
    .maybeSingle<AppUserRecord>();

  if (selectError) {
    throw new AppError(
      errorCodes.UNKNOWN_ERROR,
      `用户信息读取失败：${selectError.message}`,
      500,
    );
  }

  if (existingUser) {
    const { data, error } = await supabase
      .from("app_users")
      .update({
        nickname: user.nickname,
        avatar_url: user.avatarUrl,
        last_seen_at: now,
        updated_at: now,
      })
      .eq("id", existingUser.id)
      .select("*")
      .single<AppUserRecord>();

    if (error) {
      throw new AppError(
        errorCodes.UNKNOWN_ERROR,
        `用户信息更新失败：${error.message}`,
        500,
      );
    }

    return mapAppUserToSession(data, user.deviceId);
  }

  const { data, error } = await supabase
    .from("app_users")
    .insert({
      id: user.id,
      app_user_id: user.appUserId,
      nickname: user.nickname,
      avatar_url: user.avatarUrl,
      last_seen_at: now,
      updated_at: now,
    })
    .select("*")
    .single<AppUserRecord>();

  if (error) {
    throw new AppError(
      errorCodes.UNKNOWN_ERROR,
      `用户信息保存失败：${error.message}`,
      500,
    );
  }

  return mapAppUserToSession(data, user.deviceId);
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
