import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  count: vi.fn(),
  findUnique: vi.fn(),
  findOverride: vi.fn(),
}));

vi.mock("@/lib/config", () => ({
  config: {
    GAOKAO_UNLIMITED_TEST_USER_IDS: "test-user-id",
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    appUser: {
      findUnique: mocks.findUnique,
    },
    gaokaoGenerationOverride: {
      findUnique: mocks.findOverride,
    },
    gaokaoReport: {
      count: mocks.count,
    },
  },
}));

import { getGaokaoGenerationStatus } from "@/features/gaokao/gaokao-repository";

describe("gaokao generation status", () => {
  beforeEach(() => {
    mocks.count.mockReset();
    mocks.findUnique.mockReset();
    mocks.findOverride.mockReset();
    mocks.findUnique.mockResolvedValue(null);
    mocks.findOverride.mockResolvedValue(null);
  });

  it("allows a whitelisted test user to generate after two deleted reports", async () => {
    mocks.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(0);

    const status = await getGaokaoGenerationStatus("test-user-id");

    expect(status.canGenerate).toBe(true);
    expect(status.message).toContain("不限次数");
  });

  it("allows the built-in 离心之巅 app user id to generate repeatedly", async () => {
    mocks.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    mocks.findUnique.mockResolvedValueOnce({ app_user_id: "734275" });

    const status = await getGaokaoGenerationStatus("real-db-user-id");

    expect(status.canGenerate).toBe(true);
    expect(status.isUnlimitedTestUser).toBe(true);
    expect(status.message).toContain("不限次数");
  });

  it("keeps normal users capped after two reports", async () => {
    mocks.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(0);
    mocks.findUnique.mockResolvedValueOnce({ app_user_id: "normal-app-user-id" });

    const status = await getGaokaoGenerationStatus("normal-user-id");

    expect(status.canGenerate).toBe(false);
  });

  it("allows a reset user to generate when no reports exist after reset", async () => {
    const resetAt = new Date("2026-06-29T00:00:00.000Z");
    mocks.findUnique.mockResolvedValueOnce({ app_user_id: "normal-app-user-id" });
    mocks.findOverride.mockResolvedValueOnce({
      is_unlimited: false,
      reset_at: resetAt,
    });
    mocks.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    const status = await getGaokaoGenerationStatus("normal-user-id");

    expect(status.canGenerate).toBe(true);
    expect(status.message).toContain("管理员已重置");
    expect(mocks.count).toHaveBeenCalledWith({
      where: { user_id: "normal-user-id", created_at: { gte: resetAt } },
    });
  });
});
