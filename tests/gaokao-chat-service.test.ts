import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GaokaoProfile } from "@/features/gaokao/types";

const mocks = vi.hoisted(() => ({
  advisor: vi.fn(),
  completeProfile: vi.fn(),
  dataStatus: vi.fn(),
}));

vi.mock("@/features/gaokao/gaokao-advisor-engine", () => ({
  callGaokaoAdvisorEngine: mocks.advisor,
}));

vi.mock("@/features/gaokao/gaokao-llm", () => ({
  generateGaokaoAssistantReply: vi.fn(),
  generateGaokaoReportSummary: vi.fn(),
}));

vi.mock("@/features/gaokao/gaokao-repository", () => ({
  buildGaokaoRecommendations: vi.fn(),
  completeGaokaoProfileFromReferenceData: mocks.completeProfile,
  createGaokaoReport: vi.fn(),
  getGaokaoDataStatus: mocks.dataStatus,
  getGaokaoGenerationStatus: vi.fn(),
}));

import { continueGaokaoChat } from "@/features/gaokao/gaokao-service";

describe("gaokao chat service", () => {
  beforeEach(() => {
    mocks.advisor.mockReset();
    mocks.completeProfile.mockReset();
    mocks.dataStatus.mockReset();

    mocks.completeProfile.mockImplementation(async (profile: GaokaoProfile) =>
      profile.subjectType && profile.score && !profile.rank
        ? { ...profile, rank: 19646 }
        : profile,
    );
    mocks.dataStatus.mockResolvedValue({
      province: "四川",
      importedCount: 20740,
      sourceCount: 20740,
      batchLineCount: 6,
      scoreSegmentCount: 1049,
      years: [2025, 2024, 2023],
      missingSichuanData: false,
    });
  });

  it("fills rank from score before calling the advisor", async () => {
    mocks.advisor.mockResolvedValue({
      reply: "按你的位次先看稳档。",
      profilePatch: { preferredMajors: ["计算机"] },
      advisorNotes: [],
    });

    const result = await continueGaokaoChat({
      message: "我叫王同学，历史类，考了548分，想学计算机",
    });

    expect(mocks.advisor).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: expect.objectContaining({
          score: 548,
          rank: 19646,
        }),
      }),
    );
    expect(result.profile.rank).toBe(19646);
    expect(result.assistantMessage).toBe("按你的位次先看稳档。");
  });

  it("keeps hard facts from the user while advisor preferences affect the profile", async () => {
    mocks.advisor.mockResolvedValue({
      reply: "### 已确认\n\n- **城市偏好**：成都、重庆\n\n---",
      profilePatch: {
        score: 1,
        rank: 1,
        subjectType: "历史类",
        preferredCities: ["重庆"],
        preferredMajors: ["计算机"],
        acceptPrivate: false,
        notes: "**不读民办**",
      },
      advisorNotes: ["- **成都重庆优先**"],
    });

    const result = await continueGaokaoChat({
      message: "我叫李鑫，物理类，520分，成都优先，不读民办，想读计算机",
    });

    expect(result.profile.score).toBe(520);
    expect(result.profile.rank).toBe(19646);
    expect(result.profile.subjectType).toBe("物理类");
    expect(result.profile.preferredCities).toEqual(
      expect.arrayContaining(["成都", "重庆"]),
    );
    expect(result.profile.preferredMajors).toContain("计算机");
    expect(result.profile.acceptPrivate).toBe(false);
    expect(result.assistantMessage).not.toContain("###");
    expect(result.assistantMessage).not.toContain("**");
    expect(result.assistantMessage).not.toContain("---");
  });
});
