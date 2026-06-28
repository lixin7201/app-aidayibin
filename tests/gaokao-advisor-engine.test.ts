import { beforeEach, describe, expect, it, vi } from "vitest";

import { createEmptyGaokaoProfile } from "@/features/gaokao/types";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  config: {
    GAOKAO_ADVISOR_BASE_URL: undefined as string | undefined,
    GAOKAO_ADVISOR_API_KEY: undefined as string | undefined,
    GAOKAO_ADVISOR_TIMEOUT_MS: 15_000,
  },
}));

vi.mock("@/lib/config", () => ({
  config: mocks.config,
}));

import { callGaokaoAdvisorEngine } from "@/features/gaokao/gaokao-advisor-engine";

describe("gaokao advisor engine", () => {
  beforeEach(() => {
    mocks.fetch.mockReset();
    mocks.config.GAOKAO_ADVISOR_BASE_URL = undefined;
    mocks.config.GAOKAO_ADVISOR_API_KEY = undefined;
    mocks.config.GAOKAO_ADVISOR_TIMEOUT_MS = 15_000;
    vi.stubGlobal("fetch", mocks.fetch);
  });

  it("skips external calls when no advisor endpoint is configured", async () => {
    const result = await callGaokaoAdvisorEngine({
      userMessage: "想读计算机",
      profile: createEmptyGaokaoProfile(),
    });

    expect(result).toBeNull();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("maps advisor reply, profile patch, and notes", async () => {
    mocks.config.GAOKAO_ADVISOR_BASE_URL = "https://advisor.example.com/";
    mocks.config.GAOKAO_ADVISOR_API_KEY = "test-key";
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: "先看稳档，再挑专业组。",
        profilePatch: {
          preferredCities: ["成都"],
          acceptPrivate: false,
        },
        advisorNotes: ["成都优先", "民办先排除"],
      }),
    });

    const result = await callGaokaoAdvisorEngine({
      userMessage: "成都优先，不考虑民办",
      profile: createEmptyGaokaoProfile(),
    });

    expect(result?.reply).toContain("稳档");
    expect(result?.profilePatch.preferredCities).toEqual(["成都"]);
    expect(result?.profilePatch.acceptPrivate).toBe(false);
    expect(result?.advisorNotes).toEqual(["成都优先", "民办先排除"]);
    expect(mocks.fetch).toHaveBeenCalledWith(
      "https://advisor.example.com/gaokao/advisor",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer test-key",
        }),
      }),
    );
  });
});
