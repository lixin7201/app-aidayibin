import { createHash, timingSafeEqual } from "crypto";

import { assertProductionAdminPasswordConfigured, config } from "@/lib/config";

export function verifyAdminPassword(plainTextPassword: string) {
  assertProductionAdminPasswordConfigured();

  const expected = config.ADMIN_SESSION_PASSWORD;
  const expectedHash = createHash("sha256").update(expected).digest();
  const receivedHash = createHash("sha256")
    .update(plainTextPassword)
    .digest();

  return timingSafeEqual(expectedHash, receivedHash);
}
