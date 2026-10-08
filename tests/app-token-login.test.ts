import { describe, expect, it } from "vitest";

import {
  isPublicSharePath,
  mergeBrowserIdentityWithQfh5Profile,
  readAppTokenFromBrowserSources,
} from "@/features/auth/app-token-login";

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

describe("AppTokenLogin token sources", () => {
  it("keeps the QFH5 avatar when the browser supplies the verified token", () => {
    expect(
      mergeBrowserIdentityWithQfh5Profile(
        { app_token: "verified-wap-token" },
        {
          uid: "untrusted-client-uid",
          username: "桥接用户",
          face: "https://pic.app.dayibin.cn/avatar.jpg",
        },
      ),
    ).toEqual({
      app_token: "verified-wap-token",
      uid: "untrusted-client-uid",
      username: "桥接用户",
      face: "https://pic.app.dayibin.cn/avatar.jpg",
    });
  });

  it("prefers the existing qianfan wap token cookie", () => {
    expect(
      readAppTokenFromBrowserSources({
        cookie: "theme=dark; wap_token=verified%2Bwap-token",
        storage: { getItem: () => "existing-api-token" },
      }),
    ).toBe("verified+wap-token");
  });

  it("falls back to the existing same-origin API token", () => {
    expect(
      readAppTokenFromBrowserSources({
        cookie: "theme=dark",
        storage: { getItem: (key) => key === "classify:token" ? "api-token" : null },
      }),
    ).toBe("api-token");
  });

  it("does not return an oversized browser token", () => {
    expect(
      readAppTokenFromBrowserSources({
        cookie: `wap_token=${"x".repeat(4097)}`,
        storage: null,
      }),
    ).toBeNull();
  });
});
