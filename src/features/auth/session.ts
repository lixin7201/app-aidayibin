import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { ensureSessionUser } from "@/features/auth/app-user-repository";
import {
  decodeSignedCookie,
  encodeSignedCookie,
} from "@/lib/auth/signed-cookie";
import { isMockEnabled } from "@/lib/config";
import { AppError, errorCodes } from "@/lib/http/errors";
import { cookiePath } from "@/lib/routes";

const sessionCookieName = "aidayibin_session";

export type SessionUser = {
  id: string;
  appUserId: string;
  nickname: string;
  avatarUrl: string | null;
  deviceId: string | null;
};

function decodeSession(value: string | undefined) {
  return decodeSignedCookie<SessionUser>(value);
}

export async function setSessionCookie(user: SessionUser) {
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, encodeSignedCookie(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
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

  if (isMockEnabled) {
    return getMockSessionUser();
  }

  return null;
}

export function getSessionFromRequest(request: NextRequest) {
  const session = decodeSession(request.cookies.get(sessionCookieName)?.value);

  if (session) {
    return session;
  }

  if (isMockEnabled) {
    return getMockSessionUser();
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
    appUserId: "mock-dayibin-user-001",
    nickname: "大宜宾体验用户",
    avatarUrl: null,
    deviceId: "mock-device-001",
  };
}
