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

type ResultShareKind = "photo" | "fortune" | "gaokao";

export function signResultShareToken(kind: ResultShareKind, taskId: string) {
  const payload = `${kind}:${taskId}:result-share-page`;
  const signature = createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");

  return signature;
}

export function verifyResultShareToken(
  token: string,
  kind: ResultShareKind,
  taskId: string,
) {
  const expected = signResultShareToken(kind, taskId);

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
