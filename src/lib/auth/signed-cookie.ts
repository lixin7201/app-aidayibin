import { createHmac, timingSafeEqual } from "node:crypto";

import { config } from "@/lib/config";

const devSessionSecret = "local-aidayibin-session-secret";

function getSessionSecret() {
  if (config.APP_SESSION_SECRET) {
    return config.APP_SESSION_SECRET;
  }

  if (config.NODE_ENV === "production") {
    throw new Error("Missing required environment variable: APP_SESSION_SECRET");
  }

  return devSessionSecret;
}

function sign(payload: string) {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

export function encodeSignedCookie<T>(value: T) {
  const payload = Buffer.from(JSON.stringify(value), "utf8").toString(
    "base64url",
  );

  return `${payload}.${sign(payload)}`;
}

export function decodeSignedCookie<T>(value: string | undefined) {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}
