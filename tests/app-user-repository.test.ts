import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  upsert: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    appUser: {
      upsert: mocks.upsert,
    },
  },
}));

vi.mock("@/lib/db/records", () => ({
  toAppUserRecord: (value: unknown) => value,
}));

import { ensureSessionUser } from "@/features/auth/app-user-repository";

describe("ensureSessionUser", () => {
  beforeEach(() => {
    mocks.upsert.mockReset();
    mocks.upsert.mockResolvedValue({
      id: "user-record-id",
      app_user_id: "734275",
      nickname: "千帆用户",
      avatar_url: "https://img.example.com/existing-avatar.jpg",
    });
  });

  it("does not erase the stored avatar when profile hydration has no avatar", async () => {
    await ensureSessionUser({
      id: "session-user-id",
      appUserId: "734275",
      nickname: "千帆用户",
      avatarUrl: null,
      deviceId: null,
      identityVerified: true,
    });

    const upsertInput = mocks.upsert.mock.calls[0]?.[0];
    expect(upsertInput.update).not.toHaveProperty("avatar_url");
  });
});
