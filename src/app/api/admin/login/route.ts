import type { NextRequest } from "next/server";
import { z } from "zod";

import { verifyAdminPassword } from "@/features/admin/admin-auth";
import { setAdminSession } from "@/features/admin/admin-session";
import { apiError, apiOk } from "@/lib/http/errors";
import { getClientIp, parseJsonBody } from "@/lib/http/request";
import { assertRateLimit } from "@/lib/security/rate-limit";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = loginSchema.parse(await parseJsonBody(request));
    const clientIp = getClientIp(request);

    await assertRateLimit(`admin_login:ip:${clientIp}`, {
      window: "10m",
      maxRequests: 5,
    });

    if (!verifyAdminPassword(body.password)) {
      return apiOk(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "管理员密码错误",
          },
        },
        { status: 401 },
      );
    }

    await setAdminSession({
      username: body.username,
      role: "admin",
    });

    return apiOk({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
