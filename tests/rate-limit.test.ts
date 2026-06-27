import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkRateLimit, assertRateLimit } from "@/lib/security/rate-limit";

const mockExecuteRaw = vi.fn();
const mockFindFirst = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $executeRaw: (...args: unknown[]) => mockExecuteRaw(...args),
    apiRateLimit: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
}));

describe("rate limit", () => {
  beforeEach(() => {
    mockExecuteRaw.mockReset();
    mockFindFirst.mockReset();
  });

  it("allows the first request and creates a record", async () => {
    mockExecuteRaw.mockResolvedValue(1);
    mockFindFirst.mockResolvedValue({
      id: "1",
      count: 1,
      expires_at: new Date(Date.now() + 60_000),
    });

    const result = await checkRateLimit("test:key", {
      window: "1m",
      maxRequests: 3,
    });

    expect(result.allowed).toBe(true);
    expect(mockExecuteRaw).toHaveBeenCalledOnce();
  });

  it("blocks when count exceeds maxRequests", async () => {
    mockExecuteRaw.mockResolvedValue(1);
    mockFindFirst.mockResolvedValue({
      id: "1",
      count: 4,
      expires_at: new Date(Date.now() + 60_000),
    });

    const result = await checkRateLimit("test:key", {
      window: "1m",
      maxRequests: 3,
    });

    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("uses independent counters for different keys", async () => {
    mockExecuteRaw.mockResolvedValue(1);
    mockFindFirst.mockResolvedValue({
      id: "1",
      count: 1,
      expires_at: new Date(Date.now() + 60_000),
    });

    const a = await checkRateLimit("test:key-a", {
      window: "1m",
      maxRequests: 1,
    });
    const b = await checkRateLimit("test:key-b", {
      window: "1m",
      maxRequests: 1,
    });

    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
  });

  it("throws on assertRateLimit when blocked", async () => {
    mockExecuteRaw.mockResolvedValue(1);
    mockFindFirst.mockResolvedValue({
      id: "1",
      count: 5,
      expires_at: new Date(Date.now() + 60_000),
    });

    await expect(
      assertRateLimit("test:key", { window: "1m", maxRequests: 3 }),
    ).rejects.toThrow("操作太频繁");
  });

  it("raw sql includes updated_at and NOW(3) for insert and update", async () => {
    mockExecuteRaw.mockResolvedValue(1);
    mockFindFirst.mockResolvedValue({
      id: "1",
      count: 1,
      expires_at: new Date(Date.now() + 60_000),
    });

    await checkRateLimit("test:key", { window: "1m", maxRequests: 3 });

    const strings = mockExecuteRaw.mock.calls[0][0] as string[];
    const sqlText = strings.join("?");
    expect(sqlText).toContain("updated_at");
    expect(sqlText).toContain("NOW(3)");
    expect(sqlText).toContain("ON DUPLICATE KEY UPDATE");
    expect(sqlText).toContain("count = count +");
  });
});
