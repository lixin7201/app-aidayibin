import { describe, expect, it } from "vitest";

import { signImageToken, verifyImageToken } from "@/lib/auth/image-token";

describe("image token", () => {
  it("signs and verifies a token", () => {
    const token = signImageToken("photo", "task-123", "share");
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);

    expect(verifyImageToken(token, "photo", "task-123", "share")).toBe(true);
  });

  it("rejects a token with wrong kind", () => {
    const token = signImageToken("photo", "task-123", "share");
    expect(verifyImageToken(token, "fortune", "task-123", "share")).toBe(false);
  });

  it("rejects a token with wrong taskId", () => {
    const token = signImageToken("photo", "task-123", "share");
    expect(verifyImageToken(token, "photo", "task-456", "share")).toBe(false);
  });

  it("rejects a token with wrong variant", () => {
    const token = signImageToken("photo", "task-123", "share");
    expect(verifyImageToken(token, "photo", "task-123", "original")).toBe(false);
  });

  it("rejects a tampered token", () => {
    const token = signImageToken("photo", "task-123", "share");
    const tampered = token.slice(0, -2) + "xx";
    expect(verifyImageToken(tampered, "photo", "task-123", "share")).toBe(false);
  });

  it("signs and verifies card variant", () => {
    const token = signImageToken("photo", "task-123", "card");
    expect(verifyImageToken(token, "photo", "task-123", "card")).toBe(true);
    expect(verifyImageToken(token, "photo", "task-123", "share")).toBe(false);
    expect(verifyImageToken(token, "fortune", "task-123", "card")).toBe(false);
  });

  it("signs and verifies thumb variant", () => {
    const token = signImageToken("fortune", "task-123", "thumb");
    expect(verifyImageToken(token, "fortune", "task-123", "thumb")).toBe(true);
    expect(verifyImageToken(token, "fortune", "task-123", "card")).toBe(false);
    expect(verifyImageToken(token, "photo", "task-123", "thumb")).toBe(false);
  });

  it("rejects an invalid variant", () => {
    const token = signImageToken("photo", "task-123", "share");
    // @ts-expect-error testing invalid variant
    expect(verifyImageToken(token, "photo", "task-123", "invalid")).toBe(false);
  });
});
