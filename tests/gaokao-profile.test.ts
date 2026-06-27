import { describe, expect, it } from "vitest";

import { buildFallbackGaokaoSummary } from "@/features/gaokao/gaokao-llm";
import {
  buildNextGaokaoQuestion,
  getMissingGaokaoFields,
  mergeGaokaoProfile,
} from "@/features/gaokao/gaokao-profile";
import { createEmptyGaokaoProfile } from "@/features/gaokao/types";

describe("gaokao profile extraction", () => {
  it("extracts Sichuan subject, score, rank, preferences, and constraints", () => {
    const profile = mergeGaokaoProfile(
      undefined,
      "我是四川物理类，考了612分，全省位次3.5万，想学计算机，不要土木，可以调剂，不要民办，预算一年2万，稳一点。",
    );

    expect(profile.province).toBe("四川");
    expect(profile.examYear).toBe(2026);
    expect(profile.subjectType).toBe("物理类");
    expect(profile.score).toBe(612);
    expect(profile.rank).toBe(35000);
    expect(profile.preferredMajors).toContain("计算机");
    expect(profile.rejectedMajors).toContain("土木");
    expect(profile.riskPreference).toBe("safe");
    expect(profile.acceptAdjustment).toBe(true);
    expect(profile.acceptPrivate).toBe(false);
    expect(profile.tuitionLimit).toBe(20000);
  });

  it("keeps asking for rank even when score is present", () => {
    const profile = mergeGaokaoProfile(undefined, "历史类，考了548分");

    expect(getMissingGaokaoFields(profile)).toEqual(["全省位次"]);
    expect(buildNextGaokaoQuestion(profile)).toContain("全省位次");
  });

  it("does not invent recommendations when Sichuan data is missing", () => {
    const summary = buildFallbackGaokaoSummary({
      profile: {
        ...createEmptyGaokaoProfile(),
        subjectType: "物理类",
        score: 612,
        rank: 35000,
      },
      recommendations: { chong: [], wen: [], bao: [] },
      dataStatus: {
        province: "四川",
        importedCount: 0,
        sourceCount: 260884,
        batchLineCount: 6,
        scoreSegmentCount: 6,
        years: [],
        missingSichuanData: true,
      },
    });

    expect(summary).toContain("没有导入四川历史投档数据");
    expect(summary).toContain("不能负责任地给出冲稳保学校名单");
  });
});
