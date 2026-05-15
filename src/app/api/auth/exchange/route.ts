import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { exchangeAppIdentity } from "@/features/auth/app-auth-service";
import { setSessionCookie } from "@/features/auth/session";
import { apiError, apiOk } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/request";
import { appPath } from "@/lib/routes";

const exchangeSchema = z.object({
  app_token: z.string().optional(),
  device_id: z.string().optional(),
  app_user_id: z.string().optional(),
  uid: z.union([z.string(), z.number()]).optional(),
  nickname: z.string().optional(),
  username: z.string().optional(),
  avatar_url: z.string().optional(),
  face: z.string().optional(),
  deviceid: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = exchangeSchema.parse(await parseJsonBody(request));
    const user = await exchangeAppIdentity({
      appToken: body.app_token,
      deviceId: body.device_id ?? body.deviceid,
      appUserId: body.app_user_id,
      uid: body.uid,
      nickname: body.nickname,
      username: body.username,
      avatarUrl: body.avatar_url,
      face: body.face,
    });
    await setSessionCookie(user);

    return apiOk({
      user: {
        id: user.id,
        app_user_id: user.appUserId,
        nickname: user.nickname,
        avatar_url: user.avatarUrl,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL(appPath("/"), request.url));
}
