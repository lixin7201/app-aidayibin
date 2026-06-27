import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { encodeSignedCookie } from "@/lib/auth/signed-cookie";
import { config } from "@/lib/config";
import { appPath } from "@/lib/routes";

const oauthStateCookieName = "wechat_oauth_state";

function validateReturnTo(raw: string | null): string {
  if (!raw) return appPath("/");

  try {
    const base = new URL(config.NEXT_PUBLIC_APP_URL);
    const parsed = new URL(raw, base.origin);

    if (parsed.origin !== base.origin) {
      return appPath("/");
    }

    const path = parsed.pathname + parsed.search + parsed.hash;
    return appPath(path || "/");
  } catch {
    return appPath("/");
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const returnTo = validateReturnTo(searchParams.get("return_to"));

  if (!config.WECHAT_APP_ID) {
    return NextResponse.json(
      {
        error: {
          code: "CONFIGURATION_ERROR",
          message: "微信登录未配置",
        },
      },
      { status: 500 },
    );
  }

  const nonce = crypto.randomUUID().replace(/-/g, "");
  const statePayload = encodeSignedCookie({
    nonce,
    returnTo,
  });

  const cookieStore = await cookies();
  cookieStore.set(oauthStateCookieName, statePayload, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.NEXT_PUBLIC_APP_URL.startsWith("https://"),
    path: "/",
    maxAge: 60 * 10,
  });

  const redirectUri = `${config.WECHAT_OAUTH_REDIRECT_URL ?? config.NEXT_PUBLIC_APP_URL}/api/auth/wechat/callback`;

  const wechatUrl = new URL(
    "https://open.weixin.qq.com/connect/oauth2/authorize",
  );
  wechatUrl.searchParams.set("appid", config.WECHAT_APP_ID);
  wechatUrl.searchParams.set("redirect_uri", redirectUri);
  wechatUrl.searchParams.set("response_type", "code");
  wechatUrl.searchParams.set("scope", "snsapi_userinfo");
  wechatUrl.searchParams.set("state", nonce);
  wechatUrl.hash = "wechat_redirect";

  return NextResponse.redirect(wechatUrl.toString());
}
