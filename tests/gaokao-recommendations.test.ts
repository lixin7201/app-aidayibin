import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildGaokaoRecommendations } from "@/features/gaokao/gaokao-repository";
import { createEmptyGaokaoProfile } from "@/features/gaokao/types";

const mocks = vi.hoisted(() => ({
  admissionFindMany: vi.fn(),
  majorPlanFindMany: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    gaokaoAdmissionRecord: {
      findMany: mocks.admissionFindMany,
    },
    gaokaoMajorPlan: {
      findMany: mocks.majorPlanFindMany,
    },
  },
}));

const records = [
  {
    id: "group-chong",
    school_name: "四川大学",
    major_name: "专业组101（选科：不限）",
    year: 2025,
    subject_type: "物理类",
    batch: "本科批",
    score: 630,
    rank: 11200,
    quota: 12,
  },
  {
    id: "major-wen",
    school_name: "成都信息工程大学",
    major_name: "计算机类",
    year: 2025,
    subject_type: "物理类",
    batch: "本科批",
    score: 618,
    rank: 12600,
    quota: 24,
  },
  {
    id: "northeast-chong",
    school_name: "东北大学",
    major_name: "专业组103（选科：不限）",
    year: 2025,
    subject_type: "物理类",
    batch: "本科批",
    score: 626,
    rank: 11500,
    quota: 10,
  },
  {
    id: "northeast-wen",
    school_name: "哈尔滨工程大学",
    major_name: "专业组104（选科：不限）",
    year: 2025,
    subject_type: "物理类",
    batch: "本科批",
    score: 616,
    rank: 13000,
    quota: 14,
  },
  {
    id: "private-wen",
    school_name: "吉林师范大学博达学院",
    major_name: "专业组105（选科：不限）",
    year: 2025,
    subject_type: "物理类",
    batch: "本科批",
    score: 615,
    rank: 13100,
    quota: 20,
  },
  {
    id: "group-bao",
    school_name: "西华大学",
    major_name: "专业组205（选科：不限）",
    year: 2025,
    subject_type: "物理类",
    batch: "本科批",
    score: 602,
    rank: 15100,
    quota: 30,
  },
  {
    id: "group-bio",
    school_name: "西北农林科技大学",
    major_name: "专业组511（选科：化学，生物）",
    year: 2025,
    subject_type: "物理类",
    batch: "本科批",
    score: 601,
    rank: 15200,
    quota: 8,
  },
  {
    id: "group-politics",
    school_name: "北京大学",
    major_name: "专业组102（选科：不限）",
    year: 2025,
    subject_type: "历史类",
    batch: "本科批",
    score: 660,
    rank: 99,
    quota: 1,
  },
];

const schoolLocations: Record<
  string,
  {
    school_city: string;
    school_province: string;
    ownership: string;
    school_type: string;
  }
> = {
  四川大学: { school_city: "成都", school_province: "四川", ownership: "公办", school_type: "综合" },
  成都信息工程大学: { school_city: "成都", school_province: "四川", ownership: "公办", school_type: "理工" },
  东北大学: { school_city: "沈阳", school_province: "辽宁", ownership: "公办", school_type: "理工" },
  哈尔滨工程大学: { school_city: "哈尔滨", school_province: "黑龙江", ownership: "公办", school_type: "理工" },
  吉林师范大学博达学院: { school_city: "四平", school_province: "吉林", ownership: "民办", school_type: "独立学院" },
  西华大学: { school_city: "成都", school_province: "四川", ownership: "公办", school_type: "综合" },
  西北农林科技大学: { school_city: "杨凌", school_province: "陕西", ownership: "公办", school_type: "农林" },
  北京大学: { school_city: "北京", school_province: "北京", ownership: "公办", school_type: "综合" },
};

describe("gaokao recommendations", () => {
  beforeEach(() => {
    mocks.admissionFindMany.mockReset();
    mocks.majorPlanFindMany.mockReset();
    mocks.admissionFindMany.mockImplementation((query) =>
      records.filter((record) => {
        const rank = query.where.rank;
        return (
          record.subject_type === query.where.subject_type &&
          record.rank >= rank.gte &&
          record.rank <= rank.lte
        );
      }),
    );
    mocks.majorPlanFindMany.mockImplementation((query) => {
      const schoolName = query.where.school_name;

      if (schoolName && typeof schoolName === "object" && "in" in schoolName) {
        return schoolName.in
          .map((name: string) => ({
            school_name: name,
            ...schoolLocations[name],
          }))
          .filter((row: { school_province?: string }) => row.school_province);
      }

      return [];
    });
  });

  it("does not hard-filter major group rows when preferred majors miss", async () => {
    const profile = {
      ...createEmptyGaokaoProfile(),
      studentName: "李同学",
      firstChoiceSubject: "物理" as const,
      subjectType: "物理类" as const,
      score: 620,
      rank: 12000,
      preferredMajors: ["计算机", "物理"],
    };

    const recommendations = await buildGaokaoRecommendations(profile);

    expect(recommendations.chong.map((item) => item.id)).toContain("group-chong");
    expect(recommendations.wen.map((item) => item.id)).toContain("major-wen");
    expect(recommendations.bao.map((item) => item.id)).toContain("group-bao");
    expect(
      recommendations.chong.find((item) => item.id === "group-chong")?.reason,
    ).toContain("组内具体专业");
  });

  it("keeps the first report concise with 5 chong, 8 wen and 5 bao candidates", async () => {
    mocks.admissionFindMany.mockImplementation((query) =>
      Array.from({ length: query.take }, (_, index) => ({
        id: `${query.where.rank.gte}-${index}`,
        school_name: `测试大学${index}`,
        major_name: `专业组${100 + index}（选科：不限）`,
        year: 2025,
        subject_type: query.where.subject_type,
        batch: "本科批",
        score: 600 + index,
        rank: query.where.rank.gte + index,
        quota: 10,
      })),
    );

    const profile = {
      ...createEmptyGaokaoProfile(),
      studentName: "李同学",
      firstChoiceSubject: "物理" as const,
      subjectType: "物理类" as const,
      score: 620,
      rank: 12000,
    };

    const recommendations = await buildGaokaoRecommendations(profile);

    expect(recommendations.chong).toHaveLength(5);
    expect(recommendations.wen).toHaveLength(8);
    expect(recommendations.bao).toHaveLength(5);
  });

  it("adds official major suggestions to matching major group rows", async () => {
    mocks.majorPlanFindMany.mockImplementation((query) => {
      if (query.where.school_name !== "四川大学" || query.where.group_code !== "101") {
        return [];
      }

      return [
        {
          major_name: "计算机类",
          major_note: "含计算机科学与技术、软件工程",
          subject_requirement: "物理+化学",
          plan_count: 4,
          tuition: 6500,
          duration: "四年",
          estimated_rank_2026: 11800,
          rank_2025: 12100,
          group_rank_2025: 11200,
          group_major_count: 5,
          group_cleanliness: 0.8,
          is_new: false,
          major_category: "工学",
          major_class: "计算机类",
          major_rating: "A",
          major_ranking: 30,
          discipline_eval: "A-",
          major_level: "国家级一流本科专业",
          school_city: "成都",
          school_province: "四川",
          ownership: "公办",
        },
      ];
    });

    const profile = {
      ...createEmptyGaokaoProfile(),
      studentName: "李同学",
      firstChoiceSubject: "物理" as const,
      optionalSubjects: ["化学" as const],
      subjectType: "物理类" as const,
      score: 620,
      rank: 12000,
      preferredMajors: ["计算机"],
    };

    const recommendations = await buildGaokaoRecommendations(profile);
    const item = recommendations.chong.find((record) => record.id === "group-chong");

    expect(item?.majorSuggestions?.[0]).toMatchObject({
      majorName: "计算机类",
      planCount: 4,
      fitReason: "匹配你填写的专业偏好：计算机",
    });
  });

  it("hard-filters admission groups that require an unselected optional subject", async () => {
    const profile = {
      ...createEmptyGaokaoProfile(),
      studentName: "李同学",
      firstChoiceSubject: "物理" as const,
      optionalSubjects: ["化学" as const],
      subjectType: "物理类" as const,
      score: 620,
      rank: 12000,
      preferredMajors: ["计算机"],
    };

    const recommendations = await buildGaokaoRecommendations(profile);

    expect(recommendations.bao.map((item) => item.id)).not.toContain("group-bio");
  });

  it("hard-filters schools in rejected school provinces", async () => {
    const profile = {
      ...createEmptyGaokaoProfile(),
      studentName: "李同学",
      firstChoiceSubject: "物理" as const,
      subjectType: "物理类" as const,
      score: 620,
      rank: 12000,
      rejectedSchoolProvinces: ["四川"],
      distancePreference: "far_from_home" as const,
      locationStrictness: "hard" as const,
    };

    const recommendations = await buildGaokaoRecommendations(profile);
    const items = Object.values(recommendations).flat();

    expect(items.map((item) => item.schoolName)).not.toEqual(
      expect.arrayContaining(["四川大学", "成都信息工程大学", "西华大学"]),
    );
    expect(items.every((item) => item.schoolProvince !== "四川")).toBe(true);
    expect(items.map((item) => item.schoolName)).toEqual(
      expect.arrayContaining(["东北大学", "哈尔滨工程大学", "西北农林科技大学"]),
    );
  });

  it("hard-filters private or independent colleges using official plan ownership", async () => {
    const profile = {
      ...createEmptyGaokaoProfile(),
      studentName: "李同学",
      firstChoiceSubject: "物理" as const,
      subjectType: "物理类" as const,
      score: 620,
      rank: 12000,
      acceptPrivate: false,
    };

    const recommendations = await buildGaokaoRecommendations(profile);
    const items = Object.values(recommendations).flat();

    expect(items.map((item) => item.id)).not.toContain("private-wen");
  });

  it("keeps only northeast schools when northeast is a hard location constraint", async () => {
    const profile = {
      ...createEmptyGaokaoProfile(),
      studentName: "李同学",
      firstChoiceSubject: "物理" as const,
      subjectType: "物理类" as const,
      score: 620,
      rank: 12000,
      preferredRegions: ["东北"],
      locationStrictness: "hard" as const,
    };

    const recommendations = await buildGaokaoRecommendations(profile);
    const items = Object.values(recommendations).flat();

    expect(items.map((item) => item.schoolName)).toEqual(
      expect.arrayContaining(["东北大学", "哈尔滨工程大学"]),
    );
    expect(
      items.every((item) => ["辽宁", "吉林", "黑龙江"].includes(item.schoolProvince ?? "")),
    ).toBe(true);
  });

  it("boosts northeast as a soft preference without filtering other provinces", async () => {
    const profile = {
      ...createEmptyGaokaoProfile(),
      studentName: "李同学",
      firstChoiceSubject: "物理" as const,
      subjectType: "物理类" as const,
      score: 620,
      rank: 12000,
      preferredRegions: ["东北"],
      locationStrictness: "soft" as const,
    };

    const recommendations = await buildGaokaoRecommendations(profile);

    expect(recommendations.wen[0]?.schoolName).toBe("哈尔滨工程大学");
    expect(Object.values(recommendations).flat().map((item) => item.schoolName)).toContain(
      "成都信息工程大学",
    );
  });

  it("treats official plan 政治 requirements as 思想政治", async () => {
    mocks.majorPlanFindMany.mockImplementation((query) => {
      if (query.where.school_name !== "北京大学" || query.where.group_code !== "102") {
        return [];
      }

      return [
        {
          major_name: "马克思主义理论类",
          major_note: null,
          subject_requirement: "政治",
          plan_count: 1,
          tuition: 5000,
          duration: "四年",
          estimated_rank_2026: 90,
          rank_2025: 99,
          group_rank_2025: 99,
          group_major_count: 1,
          group_cleanliness: 1,
          is_new: false,
          major_category: "法学",
          major_class: "马克思主义理论类",
          major_rating: "A+",
          major_ranking: 1,
          discipline_eval: "A+",
          major_level: "国家级一流本科专业",
          school_city: "北京",
          school_province: "北京",
          ownership: "公办",
        },
      ];
    });
    const baseProfile = {
      ...createEmptyGaokaoProfile(),
      studentName: "李同学",
      firstChoiceSubject: "历史" as const,
      subjectType: "历史类" as const,
      score: 650,
      rank: 100,
    };

    const withoutPolitics = await buildGaokaoRecommendations({
      ...baseProfile,
      optionalSubjects: ["地理" as const],
    });
    const withPolitics = await buildGaokaoRecommendations({
      ...baseProfile,
      optionalSubjects: ["思想政治" as const],
    });

    expect(
      withoutPolitics.wen.find((record) => record.id === "group-politics")
        ?.majorSuggestions,
    ).toEqual([]);
    expect(
      withPolitics.wen.find((record) => record.id === "group-politics")
        ?.majorSuggestions?.[0]?.majorName,
    ).toBe("马克思主义理论类");
  });
});
