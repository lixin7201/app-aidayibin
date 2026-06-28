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

  it("normalizes politics shorthand in optional subjects", () => {
    const profile = mergeGaokaoProfile(
      undefined,
      "科目历史+地理+政治，522分。",
    );

    expect(profile.subjectType).toBe("历史类");
    expect(profile.score).toBe(522);
    expect(profile.optionalSubjects).toEqual(
      expect.arrayContaining(["地理", "思想政治"]),
    );
  });

  it("does not treat subject type as a preferred major", () => {
    const profile = mergeGaokaoProfile(
      undefined,
      "四川物理类560分，想去科技发达点的城市，好就业，计算机和电子都可以。",
    );

    expect(profile.subjectType).toBe("物理类");
    expect(profile.preferredMajors).toEqual(
      expect.arrayContaining(["计算机", "电子"]),
    );
    expect(profile.preferredMajors).not.toContain("物理");
  });

  it("turns far-from-home and northeast chat into location constraints", () => {
    const profile = mergeGaokaoProfile(
      undefined,
      "历史类 500 分，位次 46498。我就想离家远点，远离原生家庭。东北好一些吧。",
    );

    expect(profile.subjectType).toBe("历史类");
    expect(profile.score).toBe(500);
    expect(profile.rank).toBe(46498);
    expect(profile.rejectedSchoolProvinces).toContain("四川");
    expect(profile.preferredRegions).toContain("东北");
    expect(profile.distancePreference).toBe("far_from_home");
    expect(profile.locationStrictness).toBe("hard");
  });

  it("keeps northeast priority soft unless the user says only northeast", () => {
    const softProfile = mergeGaokaoProfile(
      undefined,
      "物理类 560 分，位次 5 万，东北优先，也可以看看其他省外城市。",
    );
    const hardProfile = mergeGaokaoProfile(
      undefined,
      "物理类 520 分，位次 8 万，只看东北，其他地方先不考虑。",
    );

    expect(softProfile.preferredRegions).toContain("东北");
    expect(softProfile.locationStrictness).toBe("soft");
    expect(hardProfile.preferredRegions).toContain("东北");
    expect(hardProfile.locationStrictness).toBe("hard");
  });

  it("does not treat Sichuan examinee identity as a Sichuan school preference", () => {
    const profile = mergeGaokaoProfile(
      undefined,
      "我叫赵同学，四川物理类520分，位次8万。只看东北，其他地方先不考虑，只要公办，不接受中外合作。",
    );

    expect(profile.preferredRegions).toContain("东北");
    expect(profile.preferredSchoolProvinces).not.toContain("四川");
    expect(profile.locationStrictness).toBe("hard");
  });

  it("separates school province and city preferences from examinee province", () => {
    const profile = mergeGaokaoProfile(
      undefined,
      "四川物理类，590分，成都重庆优先，不要四川学校，但重庆可以。",
    );

    expect(profile.province).toBe("四川");
    expect(profile.preferredSchoolCities).toEqual(
      expect.arrayContaining(["成都", "重庆"]),
    );
    expect(profile.rejectedSchoolProvinces).toContain("四川");
    expect(profile.preferredSchoolProvinces).toContain("重庆");
  });

  it("handles near-home preferences without forcing an out-of-province filter", () => {
    const profile = mergeGaokaoProfile(
      undefined,
      "历史类500分，我想离家近一点，最好以后还能回宜宾工作，不接受中外合作。",
    );

    expect(profile.distancePreference).toBe("near_home");
    expect(profile.preferredSchoolProvinces).toEqual(
      expect.arrayContaining(["四川", "重庆"]),
    );
    expect(profile.locationStrictness).toBe("soft");
    expect(profile.rejectedSchoolProvinces).not.toContain("四川");
    expect(profile.acceptSinoForeign).toBe(false);
  });

  it("captures tech city and employment oriented preferences", () => {
    const profile = mergeGaokaoProfile(
      undefined,
      "物理类560分，想去科技发达点的城市，未来好找工作，互联网和大厂机会多一点。",
    );

    expect(profile.preferredSchoolCities).toEqual(
      expect.arrayContaining(["北京", "上海", "深圳", "杭州", "成都"]),
    );
    expect(profile.preferredMajors).toEqual(
      expect.arrayContaining(["计算机", "软件", "人工智能", "电子"]),
    );
    expect(profile.notes).toContain("就业导向");
    expect(profile.notes).toContain("城市产业");
  });

  it("captures civil service and postgraduate goals as professional notes", () => {
    const profile = mergeGaokaoProfile(
      undefined,
      "历史类540分，以后想考公，也可能考研，专业别太虚。",
    );

    expect(profile.riskPreference).toBe("safe");
    expect(profile.preferredMajors).toEqual(
      expect.arrayContaining(["法学", "汉语言", "会计", "思想政治"]),
    );
    expect(profile.notes).toContain("考公");
    expect(profile.notes).toContain("深造路径");
  });

  it("uses direct professional advisor style without naming external people or making promises", () => {
    const profile = mergeGaokaoProfile(
      undefined,
      "你按张雪峰那种风格给我说，别绕弯，但不要保证录取。",
    );

    expect(profile.riskPreference).toBe("safe");
    expect(profile.notes).toContain("直给、专业、就业导向");
    expect(profile.notes).not.toContain("张雪峰");
    expect(profile.notes).not.toContain("保证录取");
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
