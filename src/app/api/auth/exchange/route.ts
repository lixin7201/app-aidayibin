import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { exchangeAppIdentity } from "@/features/auth/app-auth-service";
import { setSessionCookie } from "@/features/auth/session";
import { apiError, apiOk } from "@/lib/http/errors";
import { getClientIp, parseJsonBody } from "@/lib/http/request";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { appPath } from "@/lib/routes";

const exchangeSchema = z.object({
  app_token: z.string().min(1).max(4096).optional(),
  device_id: z.string().max(191).optional(),
  app_user_id: z.string().max(191).optional(),
  uid: z.union([z.string().max(191), z.number()]).optional(),
  nickname: z.string().max(191).optional(),
  username: z.string().max(191).optional(),
  avatar_url: z.string().url().max(2048).optional(),
  face: z.string().url().max(2048).optional(),
  deviceid: z.string().max(191).optional(),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const body = exchangeSchema.parse(
      await parseJsonBody(request, { maxBytes: 16 * 1024 }),
    );
    const clientIp = getClientIp(request);

    await assertRateLimit(`auth_exchange:ip:${clientIp}`, {
      window: "1m",
      maxRequests: 20,
    });

    const deviceId = body.device_id ?? body.deviceid;

    if (deviceId) {
      await assertRateLimit(`auth_exchange:device:${deviceId}`, {
        window: "1m",
        maxRequests: 10,
      });
    }

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
    await setSessionCookie(user, request);

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
