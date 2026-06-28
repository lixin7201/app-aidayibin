import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import {
  decodeSignedCookie,
  encodeSignedCookie,
} from "@/lib/auth/signed-cookie";
import { config } from "@/lib/config";
import { cookiePath } from "@/lib/routes";

const adminSessionCookieName = "aidayibin_admin_session";
const useSecureCookies = config.NEXT_PUBLIC_APP_URL.startsWith("https://");

export type AdminSession = {
  username: string;
  role: "owner" | "admin" | "operator";
};

function decodeSession(value: string | undefined) {
  return decodeSignedCookie<AdminSession>(value);
}

function shouldUseSecureCookie(request?: NextRequest) {
  if (!useSecureCookies) {
    return false;
  }

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

export async function setAdminSession(
  session: AdminSession,
  request?: NextRequest,
) {
  const cookieStore = await cookies();

  cookieStore.set(adminSessionCookieName, encodeSignedCookie(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
    path: cookiePath,
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession(request?: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.set(adminSessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
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
