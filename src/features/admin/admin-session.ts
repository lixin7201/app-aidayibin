import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import {
  decodeSignedCookie,
  encodeSignedCookie,
} from "@/lib/auth/signed-cookie";
import { cookiePath } from "@/lib/routes";

const adminSessionCookieName = "aidayibin_admin_session";

export type AdminSession = {
  username: string;
  role: "owner" | "admin" | "operator";
};

function decodeSession(value: string | undefined) {
  return decodeSignedCookie<AdminSession>(value);
}

export async function setAdminSession(session: AdminSession) {
  const cookieStore = await cookies();

  cookieStore.set(adminSessionCookieName, encodeSignedCookie(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: cookiePath,
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(adminSessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: cookiePath,
    expires: new Date(0),
  });
}

export async function getAdminSessionFromCookies() {
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(adminSessionCookieName)?.value);
}

export function getAdminSessionFromRequest(request: NextRequest) {
  return decodeSession(request.cookies.get(adminSessionCookieName)?.value);
}

export function requireAdminSessionFromRequest(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    throw new Error("管理员未登录");
  }

  return session;
}
