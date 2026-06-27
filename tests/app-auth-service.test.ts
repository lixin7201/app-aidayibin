import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = process.env;

describe("exchangeAppIdentity", () => {
  beforeEach(() => {
    vi.resetModules();
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
    vi.resetModules();
    vi.doUnmock("@/features/auth/app-user-repository");
    vi.doUnmock("@/features/auth/session");
    process.env = originalEnv;
  });

  it("keeps legacy QFH5 uid login working when token verification is not configured", async () => {
    const { exchangeAppIdentity } = await importService();

    const user = await exchangeAppIdentity({
      uid: "12345",
      username: "测试用户",
      face: "https://example.com/avatar.png",
      deviceId: "device-001",
    });

    expect(user.appUserId).toBe("12345");
    expect(user.nickname).toBe("测试用户");
    expect(user.avatarUrl).toBe("https://example.com/avatar.png");
    expect(user.deviceId).toBe("device-001");
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
