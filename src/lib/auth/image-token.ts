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

export type ImageVariant = "share" | "original" | "card" | "thumb";

export function signImageToken(
  kind: "photo" | "fortune",
  taskId: string,
  variant: ImageVariant,
) {
  const payload = `${kind}:${taskId}:${variant}`;
  const signature = createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");

  return signature;
}

export function verifyImageToken(
  token: string,
  kind: "photo" | "fortune",
  taskId: string,
  variant: ImageVariant,
) {
  const expected = signImageToken(kind, taskId, variant);

  const actualBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expected);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return false;
  }

  return true;
}
