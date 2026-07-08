import { describe, expect, it } from "vitest";

import { isPublicSharePath } from "@/features/auth/app-token-login";

describe("AppTokenLogin public share paths", () => {
  it("keeps life-test share pages out of WeChat OAuth", () => {
    expect(isPublicSharePath("/ai/share/life-test/session-1")).toBe(true);
  });

  it("keeps legacy life-test result links out of WeChat OAuth", () => {
    expect(isPublicSharePath("/ai/life-test/result/session-1")).toBe(true);
  });

  it("still requires identity on normal life-test pages", () => {
    expect(isPublicSharePath("/ai/life-test/play?session=session-1")).toBe(
      false,
    );
  });
});
