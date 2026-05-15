import { describe, expect, it } from "vitest";

import { getBeijingDate } from "@/features/quota/quota-service";

describe("quota service", () => {
  it("uses Beijing date for daily reset", () => {
    const date = new Date("2026-05-07T16:30:00.000Z");
    expect(getBeijingDate(date)).toBe("2026-05-08");
  });
});
