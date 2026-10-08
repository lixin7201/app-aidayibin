import { describe, expect, it } from "vitest";

import { isAllowedRemoteImageUrl } from "@/lib/security/remote-image";

describe("remote image allowlist", () => {
  it("allows configured Dayibin images and rejects loopback or metadata URLs", () => {
    expect(
      isAllowedRemoteImageUrl("https://pic.app.dayibin.cn/avatar/user.jpg"),
    ).toBe(true);
    expect(isAllowedRemoteImageUrl("http://127.0.0.1/internal")).toBe(false);
    expect(
      isAllowedRemoteImageUrl("http://169.254.169.254/latest/meta-data"),
    ).toBe(false);
  });
});
