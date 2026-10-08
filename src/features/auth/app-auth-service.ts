import { z } from "zod";

import { config, isMockEnabled } from "@/lib/config";
import { AppError, errorCodes } from "@/lib/http/errors";
import { ensureSessionUser } from "@/features/auth/app-user-repository";
import { getMockSessionUser } from "@/features/auth/session";
import { isAllowedRemoteImageUrl } from "@/lib/security/remote-image";

type VerifyAppTokenResult = {
  app_user_id?: string;
  uid?: string | number;
  nickname?: string;
  username?: string;
  avatar_url?: string;
  face?: string;
  device_id?: string;
  deviceid?: string;
  qfApiToken?: string;
};

const verifyResultSchema = z.object({
  app_user_id: z.string().min(1).max(191).optional(),
  uid: z.union([z.string().min(1).max(191), z.number()]).optional(),
  nickname: z.string().max(191).optional(),
  username: z.string().max(191).optional(),
  avatar_url: z.string().url().max(2048).optional(),
  face: z.string().url().max(2048).optional(),
  device_id: z.string().max(191).optional(),
  deviceid: z.string().max(191).optional(),
});

const qfLoginResultSchema = z.object({
  code: z.number(),
  data: z
    .object({
      userId: z.union([z.string().min(1).max(191), z.number()]),
      username: z.string().max(191).optional(),
      token: z.string().min(1).max(4096).optional(),
    })
    .nullable(),
});

const qfProfileResultSchema = z.object({
  code: z.number(),
  data: z
    .object({
      userName: z.string().max(191).optional(),
      avatarValue: z.string().url().max(2048).optional(),
      headimgurl: z.string().url().max(2048).optional(),
    })
    .nullable(),
});

const verifierTimeoutMs = 5_000;

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
  identityVerified: boolean;
}) {
  return ensureSessionUser({
    id: crypto.randomUUID(),
    appUserId: input.appUserId,
    nickname: input.nickname ?? "大宜宾用户",
    avatarUrl: input.avatarUrl ?? null,
    deviceId: input.deviceId ?? null,
    identityVerified: input.identityVerified,
  });
}

function isQfLoginUrl(url: URL) {
  return url.pathname.endsWith("/api/login/qfLogin");
}

function normalizeVerifyResult(value: unknown): VerifyAppTokenResult | null {
  const direct = verifyResultSchema.safeParse(value);
  const directUserId = direct.success
    ? direct.data.app_user_id ?? toAppUserId(direct.data.uid)
    : undefined;

  if (direct.success && directUserId) {
    return direct.data;
  }

  const qfLogin = qfLoginResultSchema.safeParse(value);

  if (!qfLogin.success || qfLogin.data.code !== 200 || !qfLogin.data.data) {
    return null;
  }

  return {
    app_user_id: String(qfLogin.data.data.userId),
    username: qfLogin.data.data.username,
    qfApiToken: qfLogin.data.data.token,
  };
}

async function fetchQfProfile(
  verifyUrl: URL,
  appUserId: string,
  apiToken?: string,
) {
  if (!apiToken) {
    return null;
  }

  const profileUrl = new URL(
    `/api/ucuser/${encodeURIComponent(appUserId)}`,
    verifyUrl.origin,
  );

  try {
    const response = await fetch(profileUrl.toString(), {
      method: "GET",
      redirect: "error",
      signal: AbortSignal.timeout(verifierTimeoutMs),
      headers: { authorization: `Bearer ${apiToken}` },
    });

    if (!response.ok) {
      return null;
    }

    const parsed = qfProfileResultSchema.safeParse(await response.json());

    return parsed.success && parsed.data.code === 200 ? parsed.data.data : null;
  } catch {
    return null;
  }
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

  // Bare QFH5 uid is only acceptable for local integration testing. Production
  // identity must come from the server-verified app token path below.
  if (normalizedAppUserId && process.env.NODE_ENV !== "production") {
    return buildSessionUser({
      appUserId: normalizedAppUserId,
      nickname: normalizedNickname,
      avatarUrl: null,
      deviceId: deviceId ?? mockUser.deviceId,
      identityVerified: false,
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

  const verifyUrl = new URL(config.APP_AUTH_VERIFY_URL);
  const qfLogin = isQfLoginUrl(verifyUrl);

  if (
    qfLogin &&
    verifyUrl.hostname !== "127.0.0.1" &&
    verifyUrl.hostname !== "localhost" &&
    verifyUrl.hostname !== "[::1]"
  ) {
    throw new AppError(
      errorCodes.CONFIGURATION_ERROR,
      "千帆登录校验仅允许走服务器回环地址",
      500,
    );
  }

  if (!qfLogin && process.env.NODE_ENV === "production" && !config.APP_AUTH_SHARED_SECRET) {
    throw new AppError(
      errorCodes.CONFIGURATION_ERROR,
      "App 登录校验密钥未配置",
      500,
    );
  }

  if (qfLogin) {
    verifyUrl.searchParams.set("token", appToken);
  }

  let response: Response;

  try {
    response = await fetch(verifyUrl.toString(), {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(verifierTimeoutMs),
      headers: {
        "content-type": "application/json",
        ...(!qfLogin && config.APP_AUTH_SHARED_SECRET
          ? { authorization: `Bearer ${config.APP_AUTH_SHARED_SECRET}` }
          : {}),
      },
      ...(qfLogin
        ? {}
        : { body: JSON.stringify({ app_token: appToken, device_id: deviceId }) }),
    });
  } catch {
    throw new AppError(errorCodes.UNAUTHORIZED, "登录校验失败，请重新进入", 401);
  }

  if (!response.ok) {
    throw new AppError(errorCodes.UNAUTHORIZED, "登录已过期，请重新进入", 401);
  }

  let result: VerifyAppTokenResult | null;

  try {
    result = normalizeVerifyResult(await response.json());
  } catch {
    result = null;
  }

  if (!result) {
    throw new AppError(errorCodes.UNAUTHORIZED, "登录信息无效", 401);
  }
  const verifiedAppUserId = result.app_user_id ?? toAppUserId(result.uid);

  if (!verifiedAppUserId) {
    throw new AppError(errorCodes.UNAUTHORIZED, "登录信息无效", 401);
  }

  const qfProfile = qfLogin
    ? await fetchQfProfile(verifyUrl, verifiedAppUserId, result.qfApiToken)
    : null;
  const clientAvatarUrl = avatarUrl ?? face;
  const verifiedClientAvatarUrl =
    qfLogin && clientAvatarUrl && isAllowedRemoteImageUrl(clientAvatarUrl)
      ? clientAvatarUrl
      : null;

  return buildSessionUser({
    appUserId: verifiedAppUserId,
    nickname: qfProfile?.userName ?? result.nickname ?? result.username,
    avatarUrl:
      qfProfile?.avatarValue ??
      qfProfile?.headimgurl ??
      verifiedClientAvatarUrl ??
      result.avatar_url ??
      result.face ??
      null,
    deviceId: result.device_id ?? result.deviceid ?? deviceId ?? null,
    identityVerified: true,
  });
}
