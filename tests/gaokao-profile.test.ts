import { describe, expect, it } from "vitest";

import { buildFallbackGaokaoSummary } from "@/features/gaokao/gaokao-llm";
import {
  buildGaokaoReportContent,
  cleanLegacyMarkdown,
  parseGaokaoReportContent,
} from "@/features/gaokao/gaokao-report";
import {
  buildNextGaokaoQuestion,
  getMissingGaokaoFields,
  mergeGaokaoProfile,
} from "@/features/gaokao/gaokao-profile";
import {
  createEmptyGaokaoProfile,
  type GaokaoProfile,
} from "@/features/gaokao/types";

describe("gaokao profile extraction", () => {
  it("extracts Sichuan subject, score, rank, preferences, and constraints", () => {
    const profile = mergeGaokaoProfile(
      undefined,
      "我叫李同学，是四川物理类，考了612分，全省位次3.5万，想学计算机，不要土木，可以调剂，不要民办，预算一年2万，稳一点。",
    );

    expect(profile.province).toBe("四川");
    expect(profile.examYear).toBe(2026);
    expect(profile.studentName).toBe("李同学");
    expect(profile.firstChoiceSubject).toBe("物理");
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

  it("accepts score without requiring rank", () => {
    const profile = mergeGaokaoProfile(undefined, "我叫王同学，历史类，考了548分");

    expect(getMissingGaokaoFields(profile)).toEqual([]);
    expect(buildNextGaokaoQuestion(profile)).toContain("偏好");
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

  it("cleans legacy markdown report text", () => {
    const cleaned = cleanLegacyMarkdown(
      "# 标题\n\n**结论**\n\n| 学校 | 位次 |\n| --- | --- |\n---\n- 下一步",
    );

    expect(cleaned).not.toContain("#");
    expect(cleaned).not.toContain("**");
    expect(cleaned).not.toContain("---");
    expect(cleaned).toContain("结论");
  });

  it("parses structured reports without exposing markdown", () => {
    const profile = {
      ...createEmptyGaokaoProfile(),
      studentName: "李同学",
      subjectType: "物理类" as const,
      score: 620,
      rank: 12000,
    };
    const content = parseGaokaoReportContent({
      summary: "# **旧报告**",
      profile,
      recommendations: { chong: [], wen: [], bao: [] },
    });

    expect(content.studentSnapshot.name).toBe("李同学");
    expect(content.strategySummary[0]).toBe("旧报告");
  });

  it("puts advisor preferences and notes into the structured report", () => {
    const profile: GaokaoProfile = {
      ...createEmptyGaokaoProfile(),
      studentName: "李同学",
      firstChoiceSubject: "物理" as const,
      optionalSubjects: ["化学", "生物"],
      subjectType: "物理类" as const,
      score: 620,
      rank: 12000,
      preferredMajors: ["计算机"],
      rejectedMajors: ["土木"],
      preferredCities: ["成都"],
      rejectedCities: ["太远城市"],
      acceptPrivate: false,
      acceptSinoForeign: false,
      acceptAdjustment: true,
      tuitionLimit: 20000,
      notes: "顾问建议稳档优先看专业组范围",
    };

    const content = buildGaokaoReportContent({
      profile,
      recommendations: { chong: [], wen: [], bao: [] },
    });
    const advisorText = content.advisorReferences.join("\n");
    const riskText = content.conditionRisks.join("\n");

    expect(content.candidateProfile.join("\n")).toContain("物理 + 化学 + 生物");
    expect(advisorText).toContain("计算机");
    expect(advisorText).toContain("顾问建议稳档优先看专业组范围");
    expect(riskText).toContain("不接受民办");
    expect(riskText).toContain("接受调剂");
  });
});
