import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireStoredSessionFromRequest: vi.fn(),
}));

vi.mock("@/features/auth/session", () => ({
  requireStoredSessionFromRequest: mocks.requireStoredSessionFromRequest,
}));

import { requireGaokaoAdminRequest } from "@/features/gaokao/gaokao-admin-auth";

describe("gaokao admin auth", () => {
  beforeEach(() => {
    mocks.requireStoredSessionFromRequest.mockReset();
  });

  it("rejects a built-in admin id from the unverified legacy uid flow", async () => {
    mocks.requireStoredSessionFromRequest.mockResolvedValue({
      id: "user-1",
      appUserId: "734275",
      nickname: "spoofed",
      avatarUrl: null,
      deviceId: null,
      identityVerified: false,
    });

    await expect(
      requireGaokaoAdminRequest({} as NextRequest),
    ).rejects.toMatchObject({ status: 403 });
  });
});
