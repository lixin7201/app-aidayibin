import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { ensureSessionUser } from "@/features/auth/app-user-repository";
import { setSessionCookie } from "@/features/auth/session";
import { decodeSignedCookie } from "@/lib/auth/signed-cookie";
import { config } from "@/lib/config";
import { appPath } from "@/lib/routes";

const oauthStateCookieName = "wechat_oauth_state";

type WeChatAccessTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  openid: string;
  scope: string;
  unionid?: string;
};

type WeChatUserInfoResponse = {
  openid: string;
  nickname: string;
  sex: number;
  province: string;
  city: string;
  country: string;
  headimgurl: string;
  privilege: string[];
  unionid?: string;
};

function redirectWithError(error: string) {
  return NextResponse.redirect(
    new URL(appPath(`/?error=${encodeURIComponent(error)}`), config.NEXT_PUBLIC_APP_URL),
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return redirectWithError("wechat_auth_denied");
  }

  const cookieStore = await cookies();
  const cookieState = cookieStore.get(oauthStateCookieName)?.value;

  if (!cookieState) {
    return redirectWithError("wechat_state_invalid");
  }

  const decoded = decodeSignedCookie<{ nonce: string; returnTo: string }>(
    cookieState,
  );

  if (!decoded || decoded.nonce !== state) {
    return redirectWithError("wechat_state_invalid");
  }

  cookieStore.delete(oauthStateCookieName);

  if (!config.WECHAT_APP_ID || !config.WECHAT_APP_SECRET) {
    return redirectWithError("wechat_not_configured");
  }

  const tokenUrl = new URL(
    "https://api.weixin.qq.com/sns/oauth2/access_token",
  );
  tokenUrl.searchParams.set("appid", config.WECHAT_APP_ID);
  tokenUrl.searchParams.set("secret", config.WECHAT_APP_SECRET);
  tokenUrl.searchParams.set("code", code);
  tokenUrl.searchParams.set("grant_type", "authorization_code");

  const tokenRes = await fetch(tokenUrl.toString());
  const tokenData = (await tokenRes.json()) as WeChatAccessTokenResponse & {
    errcode?: number;
    errmsg?: string;
  };

  if (tokenData.errcode || !tokenData.access_token || !tokenData.openid) {
    return redirectWithError("wechat_token_failed");
  }

  const userInfoUrl = new URL("https://api.weixin.qq.com/sns/userinfo");
  userInfoUrl.searchParams.set("access_token", tokenData.access_token);
  userInfoUrl.searchParams.set("openid", tokenData.openid);
  userInfoUrl.searchParams.set("lang", "zh_CN");

  const userRes = await fetch(userInfoUrl.toString());
  const userData = (await userRes.json()) as WeChatUserInfoResponse & {
    errcode?: number;
    errmsg?: string;
  };

  if (userData.errcode || !userData.openid) {
    return redirectWithError("wechat_userinfo_failed");
  }

  const appUserId = userData.unionid
    ? `wechat_union:${userData.unionid}`
    : `wechat:${userData.openid}`;

  const user = await ensureSessionUser({
    id: crypto.randomUUID(),
    appUserId,
    nickname: userData.nickname || "微信用户",
    avatarUrl: userData.headimgurl || null,
    deviceId: null,
  });

  await setSessionCookie(user, request);

  const returnTo = decoded.returnTo || "/";
  return NextResponse.redirect(
    new URL(returnTo, config.NEXT_PUBLIC_APP_URL),
  );
}
