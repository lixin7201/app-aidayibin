import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { ensureSessionUser } from "@/features/auth/app-user-repository";
import {
  decodeSignedCookie,
  encodeSignedCookie,
} from "@/lib/auth/signed-cookie";
import { config, isMockEnabled } from "@/lib/config";
import { AppError, errorCodes } from "@/lib/http/errors";
import { cookiePath } from "@/lib/routes";

const sessionCookieName = "aidayibin_session";
const mockAppUserId = "mock-dayibin-user-001";
const useSecureCookies = config.NEXT_PUBLIC_APP_URL.startsWith("https://");

export type SessionUser = {
  id: string;
  appUserId: string;
  nickname: string;
  avatarUrl: string | null;
  deviceId: string | null;
};

function shouldUseSecureCookie(request?: NextRequest) {
  if (request) {
    const forwardedProto = request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim();

    if (forwardedProto) {
      return forwardedProto === "https";
    }

    return new URL(request.url).protocol === "https:";
  }

  return useSecureCookies;
}

function decodeSession(value: string | undefined) {
  const session = decodeSignedCookie<SessionUser>(value);

  if (session?.appUserId === mockAppUserId && !isMockEnabled) {
    return null;
  }

  return session;
}

export async function setSessionCookie(user: SessionUser, request?: NextRequest) {
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, encodeSignedCookie(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
    path: cookiePath,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSessionFromCookies() {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get(sessionCookieName)?.value);

  if (session) {
    return session;
  }

  return null;
}

export function getSessionFromRequest(request: NextRequest) {
  const session = decodeSession(request.cookies.get(sessionCookieName)?.value);

  if (session) {
    return session;
  }

  return null;
}

export function requireSessionFromRequest(request: NextRequest) {
  const session = getSessionFromRequest(request);

  if (!session) {
    throw new AppError(errorCodes.UNAUTHORIZED, "请先登录大宜宾 App", 401);
  }

  return session;
}

export async function getStoredSessionFromCookies() {
  const session = await getSessionFromCookies();

  return session ? ensureSessionUser(session) : null;
}

export async function requireStoredSessionFromRequest(request: NextRequest) {
  const session = requireSessionFromRequest(request);

  return ensureSessionUser(session);
}

export function getMockSessionUser(): SessionUser {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    appUserId: mockAppUserId,
    nickname: "大宜宾体验用户",
    avatarUrl: null,
    deviceId: "mock-device-001",
  };
}
