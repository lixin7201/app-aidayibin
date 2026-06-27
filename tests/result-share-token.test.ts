import { describe, expect, it } from "vitest";

import {
  signResultShareToken,
  verifyResultShareToken,
} from "@/lib/auth/result-share-token";

describe("result share token", () => {
  it("signs and verifies a valid token", () => {
    const token = signResultShareToken("photo", "task-123");
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);

    expect(verifyResultShareToken(token, "photo", "task-123")).toBe(true);
  });

  it("rejects a token with wrong kind", () => {
    const token = signResultShareToken("photo", "task-123");
    expect(verifyResultShareToken(token, "fortune", "task-123")).toBe(false);
  });

  it("rejects a token with wrong taskId", () => {
    const token = signResultShareToken("photo", "task-123");
    expect(verifyResultShareToken(token, "photo", "task-456")).toBe(false);
  });

  it("rejects a tampered token", () => {
    const token = signResultShareToken("photo", "task-123");
    const tampered = token.slice(0, -2) + "xx";
    expect(verifyResultShareToken(tampered, "photo", "task-123")).toBe(false);
  });
});
