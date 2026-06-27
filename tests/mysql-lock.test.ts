import { describe, expect, it, vi } from "vitest";

import {
  acquireMysqlAdvisoryLock,
  releaseMysqlAdvisoryLock,
} from "@/lib/db/mysql-lock";

describe("mysql advisory lock", () => {
  it("uses a non-reserved alias and accepts non-number success values", async () => {
    const queryRaw = vi.fn().mockResolvedValue([{ lock_status: "1" }]);

    const acquired = await acquireMysqlAdvisoryLock(
      { $queryRaw: queryRaw },
      "ai_quota:user:photo",
      5,
    );

    expect(acquired).toBe(true);
    const strings = queryRaw.mock.calls[0][0] as TemplateStringsArray;
    const sqlText = Array.from(strings).join("?");
    expect(sqlText).toContain("as lock_status");
    expect(sqlText).not.toMatch(/\bas\s+lock\b/);
  });

  it("returns false when MySQL does not acquire the lock", async () => {
    const queryRaw = vi.fn().mockResolvedValue([{ lock_status: 0 }]);

    await expect(
      acquireMysqlAdvisoryLock({ $queryRaw: queryRaw }, "ai_quota:user:photo"),
    ).resolves.toBe(false);
  });

  it("releases the same lock key", async () => {
    const queryRaw = vi.fn().mockResolvedValue([]);

    await releaseMysqlAdvisoryLock({ $queryRaw: queryRaw }, "ai_quota:user:photo");

    expect(Array.from(queryRaw.mock.calls[0][0]).join("?")).toContain(
      "RELEASE_LOCK",
    );
    expect(queryRaw.mock.calls[0][1]).toBe("ai_quota:user:photo");
  });
});
