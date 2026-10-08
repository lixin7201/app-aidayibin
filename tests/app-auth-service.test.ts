import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = process.env;

describe("exchangeAppIdentity", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn());
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "http://ces.dayibin.cn/ai",
      NEXT_PUBLIC_ENABLE_MOCKS: "false",
      APP_AUTH_VERIFY_URL: "",
      APP_AUTH_SHARED_SECRET: "",
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.doUnmock("@/features/auth/app-user-repository");
    vi.doUnmock("@/features/auth/session");
    process.env = originalEnv;
  });

  it("rejects a bare QFH5 uid in production when token verification is missing", async () => {
    const { exchangeAppIdentity } = await importService();

    await expect(
      exchangeAppIdentity({
        uid: "12345",
        username: "测试用户",
        face: "https://example.com/avatar.png",
        deviceId: "device-001",
      }),
    ).rejects.toThrow("请先登录大宜宾 App");
  });

  it("requires app_token in production once token verification is configured", async () => {
    process.env.APP_AUTH_VERIFY_URL = "https://auth.example.com/verify";

    const { exchangeAppIdentity } = await importService();

    await expect(
      exchangeAppIdentity({
        uid: "12345",
        username: "测试用户",
        deviceId: "device-001",
      }),
    ).rejects.toThrow("请先登录大宜宾 App");
  });

  it("uses only the canonical identity returned by the verifier", async () => {
    process.env.APP_AUTH_VERIFY_URL = "https://auth.example.com/verify";
    process.env.APP_AUTH_SHARED_SECRET = "server-only-secret";
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        app_user_id: "canonical-user",
        nickname: "服务端用户",
        avatar_url: "https://img.example.com/avatar.jpg",
      }),
    );

    const { exchangeAppIdentity } = await importService();
    const user = await exchangeAppIdentity({
      appToken: "valid-app-token",
      appUserId: "forged-user",
      nickname: "伪造昵称",
      deviceId: "device-001",
    });

    expect(user).toMatchObject({
      appUserId: "canonical-user",
      nickname: "服务端用户",
      avatarUrl: "https://img.example.com/avatar.jpg",
      identityVerified: true,
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://auth.example.com/verify",
      expect.objectContaining({
        redirect: "error",
        headers: expect.objectContaining({
          authorization: "Bearer server-only-secret",
        }),
      }),
    );
  });

  it("adapts the existing loopback qfLogin response to a verified identity", async () => {
    process.env.APP_AUTH_VERIFY_URL =
      "http://127.0.0.1:8080/api/login/qfLogin";
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        Response.json({
          code: 200,
          data: {
            userId: 734275,
            username: "千帆用户",
            token: "local-api-token",
          },
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          code: 200,
          data: {
            userName: "千帆用户",
            avatarValue: "https://img.example.com/qianfan-avatar.jpg",
          },
        }),
      );

    const { exchangeAppIdentity } = await importService();
    const user = await exchangeAppIdentity({
      appToken: "valid-wap-token",
      uid: "forged-user",
    });

    expect(user).toMatchObject({
      appUserId: "734275",
      nickname: "千帆用户",
      avatarUrl: "https://img.example.com/qianfan-avatar.jpg",
      identityVerified: true,
    });
    const loginRequestUrl = new URL(String(vi.mocked(fetch).mock.calls[0]?.[0]));
    expect(loginRequestUrl.origin).toBe("http://127.0.0.1:8080");
    expect(loginRequestUrl.searchParams.get("token")).toBe("valid-wap-token");

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "http://127.0.0.1:8080/api/ucuser/734275",
      expect.objectContaining({
        redirect: "error",
        headers: {
          authorization: "Bearer local-api-token",
        },
      }),
    );
  });

  it("does not trust a client avatar when the authoritative qf profile is unavailable", async () => {
    process.env.APP_AUTH_VERIFY_URL =
      "http://127.0.0.1:8080/api/login/qfLogin";
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        Response.json({
          code: 200,
          data: {
            userId: 734275,
            username: "千帆用户",
            token: "local-api-token",
          },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 401 }));

    const { exchangeAppIdentity } = await importService();
    const user = await exchangeAppIdentity({
      appToken: "valid-wap-token",
      uid: "forged-user",
      face: "https://attacker.example.com/avatar.jpg",
    });

    expect(user).toMatchObject({
      appUserId: "734275",
      nickname: "千帆用户",
      avatarUrl: null,
      identityVerified: true,
    });
  });

  it("accepts a trusted QFH5 avatar only after qf token verification", async () => {
    process.env.APP_AUTH_VERIFY_URL =
      "http://127.0.0.1:8080/api/login/qfLogin";
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        Response.json({
          code: 200,
          data: {
            userId: 734275,
            username: "千帆用户",
            token: "local-api-token",
          },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 404 }));

    const { exchangeAppIdentity } = await importService();
    const user = await exchangeAppIdentity({
      appToken: "valid-wap-token",
      uid: "forged-user",
      face: "https://pic.app.dayibin.cn/avatar.jpg",
    });

    expect(user).toMatchObject({
      appUserId: "734275",
      avatarUrl: "https://pic.app.dayibin.cn/avatar.jpg",
      identityVerified: true,
    });
  });

  it("refuses to send qfLogin query tokens through a public host", async () => {
    process.env.APP_AUTH_VERIFY_URL =
      "https://x.dayibin.cn/prod-api/api/login/qfLogin";

    const { exchangeAppIdentity } = await importService();

    await expect(
      exchangeAppIdentity({ appToken: "valid-wap-token" }),
    ).rejects.toThrow("千帆登录校验仅允许走服务器回环地址");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("requires a server secret for a generic production verifier", async () => {
    process.env.APP_AUTH_VERIFY_URL = "https://auth.example.com/verify";

    const { exchangeAppIdentity } = await importService();

    await expect(
      exchangeAppIdentity({ appToken: "valid-app-token" }),
    ).rejects.toThrow("App 登录校验密钥未配置");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fails closed without exposing verifier network errors", async () => {
    process.env.APP_AUTH_VERIFY_URL =
      "http://127.0.0.1:8080/api/login/qfLogin";
    vi.mocked(fetch).mockRejectedValue(new Error("request URL contained a token"));

    const { exchangeAppIdentity } = await importService();

    await expect(
      exchangeAppIdentity({ appToken: "sensitive-wap-token" }),
    ).rejects.toThrow("登录校验失败，请重新进入");
  });
});

async function importService() {
  vi.doMock("@/features/auth/app-user-repository", () => ({
    ensureSessionUser: vi.fn((user) => Promise.resolve(user)),
  }));
  vi.doMock("@/features/auth/session", () => ({
    getMockSessionUser: () => ({
      id: "00000000-0000-4000-8000-000000000001",
      appUserId: "mock-dayibin-user-001",
      nickname: "大宜宾体验用户",
      avatarUrl: null,
      deviceId: "mock-device-001",
    }),
  }));

  return import("@/features/auth/app-auth-service");
}
