import { beforeEach, describe, expect, it, vi } from "vitest";

describe("life-test write access", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.APP_SESSION_SECRET = "test-life-session-secret";
  });

  it("binds an anonymous write token to exactly one session", async () => {
    const { canWriteLifeTestSession, createLifeTestWriteToken } =
      await import("@/features/life-test/life-test-service");
    const token = createLifeTestWriteToken("session-a");

    expect(
      canWriteLifeTestSession(
        { id: "session-a", user_id: null },
        null,
        token,
      ),
    ).toBe(true);
    expect(
      canWriteLifeTestSession(
        { id: "session-b", user_id: null },
        null,
        token,
      ),
    ).toBe(false);
  });

  it("does not trust an unverified uid as session ownership", async () => {
    const { canWriteLifeTestSession } = await import(
      "@/features/life-test/life-test-service"
    );
    const session = { id: "session-a", user_id: "user-a" };

    expect(
      canWriteLifeTestSession(session, {
        id: "user-a",
        appUserId: "734275",
        nickname: "legacy",
        avatarUrl: null,
        deviceId: null,
        identityVerified: false,
      }),
    ).toBe(false);
    expect(
      canWriteLifeTestSession(session, {
        id: "user-a",
        appUserId: "734275",
        nickname: "verified",
        avatarUrl: null,
        deviceId: null,
        identityVerified: true,
      }),
    ).toBe(true);
  });

  it("exposes only the public share fields without a write capability", async () => {
    const { toPublicSessionPayload } = await import(
      "@/features/life-test/life-test-service"
    );
    const payload = toPublicSessionPayload({
      id: "session-a",
      nickname: "测试用户",
      avatarUrl: null,
      campaignId: "private-campaign",
      entryScene: "private-scene",
      channel: "private-channel",
      regionCode: "private-region",
      shareCode: "private-share",
      referrerSessionId: "private-referrer",
      status: "completed",
      answers: [{ questionId: "q1", optionId: "a1" }],
      score: null,
      result: null,
      createdAt: "2026-08-28T00:00:00.000Z",
      completedAt: "2026-08-28T00:01:00.000Z",
      repeatHigh: true,
    });

    expect(payload).toEqual({
      id: "session-a",
      nickname: "测试用户",
      avatarUrl: null,
      status: "completed",
      result: null,
    });
  });
});
