import { prisma } from "@/lib/db/prisma";
import { AppError, errorCodes } from "@/lib/http/errors";

export type RateLimitWindow = "1m" | "10m" | "1h" | "1d";

const windowMs: Record<RateLimitWindow, number> = {
  "1m": 60_000,
  "10m": 600_000,
  "1h": 3_600_000,
  "1d": 86_400_000,
};

function getWindowStart(now: Date, window: RateLimitWindow): Date {
  const ms = windowMs[window];
  const timestamp = Math.floor(now.getTime() / ms) * ms;
  return new Date(timestamp);
}

export async function checkRateLimit(
  key: string,
  options: { window: RateLimitWindow; maxRequests: number; increment?: number },
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const increment = options.increment ?? 1;
  const now = new Date();
  const windowStart = getWindowStart(now, options.window);
  const expiresAt = new Date(windowStart.getTime() + windowMs[options.window]);

  await prisma.$executeRaw`
    INSERT INTO api_rate_limits (id, rate_key, window_start, count, expires_at, created_at, updated_at)
    VALUES (${crypto.randomUUID()}, ${key}, ${windowStart}, ${increment}, ${expiresAt}, NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE count = count + ${increment}, updated_at = NOW(3)
  `;

  const record = await prisma.apiRateLimit.findFirst({
    where: {
      rate_key: key,
      window_start: windowStart,
    },
  });

  if (!record) {
    return { allowed: false, retryAfter: Math.ceil(windowMs[options.window] / 1000) };
  }

  if (record.count > options.maxRequests) {
    const retryAfter = Math.ceil(
      (record.expires_at.getTime() - now.getTime()) / 1000,
    );
    return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
  }

  return { allowed: true };
}

export async function assertRateLimit(
  key: string,
  options: { window: RateLimitWindow; maxRequests: number; increment?: number },
) {
  const result = await checkRateLimit(key, options);

  if (!result.allowed) {
    throw new AppError(
      errorCodes.RATE_LIMITED,
      "操作太频繁，请稍后再试",
      429,
    );
  }
}

export async function cleanupExpiredRateLimits() {
  await prisma.apiRateLimit.deleteMany({
    where: {
      expires_at: { lt: new Date() },
    },
  });
}
