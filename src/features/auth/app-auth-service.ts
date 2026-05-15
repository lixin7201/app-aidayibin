import { config, isMockEnabled } from "@/lib/config";
import { AppError, errorCodes } from "@/lib/http/errors";
import { ensureSessionUser } from "@/features/auth/app-user-repository";
import { getMockSessionUser } from "@/features/auth/session";

type VerifyAppTokenResult = {
  app_user_id?: string;
  uid?: string | number;
  nickname?: string;
  username?: string;
  avatar_url?: string;
  face?: string;
  device_id?: string;
  deviceid?: string;
};

type ExchangeAppIdentityInput = {
  appToken?: string;
  deviceId?: string;
  appUserId?: string;
  uid?: string | number;
  nickname?: string;
  username?: string;
  avatarUrl?: string;
  face?: string;
};

function toAppUserId(value: string | number | undefined) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return String(value);
}

function buildSessionUser(input: {
  appUserId: string;
  nickname?: string;
  avatarUrl?: string | null;
  deviceId?: string | null;
}) {
  return ensureSessionUser({
    id: crypto.randomUUID(),
    appUserId: input.appUserId,
    nickname: input.nickname ?? "大宜宾用户",
    avatarUrl: input.avatarUrl ?? null,
    deviceId: input.deviceId ?? null,
  });
}

export async function exchangeAppIdentity({
  appToken,
  deviceId,
  appUserId,
  uid,
  nickname,
  username,
  avatarUrl,
  face,
}: ExchangeAppIdentityInput) {
  const mockUser = getMockSessionUser();
  const normalizedAppUserId = appUserId ?? toAppUserId(uid);
  const normalizedNickname = nickname ?? username;
  const normalizedAvatarUrl = avatarUrl ?? face;

  if (normalizedAppUserId) {
    return buildSessionUser({
      appUserId: normalizedAppUserId,
      nickname: normalizedNickname,
      avatarUrl: normalizedAvatarUrl,
      deviceId: deviceId ?? mockUser.deviceId,
    });
  }

  if (isMockEnabled && (!appToken || appToken === "mock-app-token")) {
    return ensureSessionUser({
      ...mockUser,
      deviceId: deviceId ?? mockUser.deviceId,
    });
  }

  if (!appToken) {
    throw new AppError(errorCodes.UNAUTHORIZED, "请先登录大宜宾 App", 401);
  }

  if (!config.APP_AUTH_VERIFY_URL) {
    throw new AppError(
      errorCodes.CONFIGURATION_ERROR,
      "App 登录校验接口未配置",
      500,
    );
  }

  const response = await fetch(config.APP_AUTH_VERIFY_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(config.APP_AUTH_SHARED_SECRET
        ? { authorization: `Bearer ${config.APP_AUTH_SHARED_SECRET}` }
        : {}),
    },
    body: JSON.stringify({ app_token: appToken, device_id: deviceId }),
  });

  if (!response.ok) {
    throw new AppError(errorCodes.UNAUTHORIZED, "登录已过期，请重新进入", 401);
  }

  const result = (await response.json()) as VerifyAppTokenResult;
  const verifiedAppUserId = result.app_user_id ?? toAppUserId(result.uid);

  if (!verifiedAppUserId) {
    throw new AppError(errorCodes.UNAUTHORIZED, "登录信息无效", 401);
  }

  return buildSessionUser({
    appUserId: verifiedAppUserId,
    nickname: result.nickname ?? result.username,
    avatarUrl: result.avatar_url ?? result.face ?? null,
    deviceId: result.device_id ?? result.deviceid ?? deviceId ?? null,
  });
}
