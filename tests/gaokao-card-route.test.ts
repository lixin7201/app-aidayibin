import { describe, expect, it, vi } from "vitest";

import {
  buildGaokaoReportContent,
  serializeGaokaoReportContent,
} from "@/features/gaokao/gaokao-report";
import { createEmptyGaokaoProfile } from "@/features/gaokao/types";
import { signResultShareToken } from "@/lib/auth/result-share-token";

const mocks = vi.hoisted(() => ({
  getPublicGaokaoReport: vi.fn(),
}));

vi.mock("@/features/gaokao/gaokao-repository", () => ({
  getPublicGaokaoReport: mocks.getPublicGaokaoReport,
}));

const profile = {
  ...createEmptyGaokaoProfile(),
  studentName: "林同学",
  firstChoiceSubject: "历史" as const,
  optionalSubjects: ["地理" as const, "思想政治" as const],
  subjectType: "历史类" as const,
  score: 500,
  rank: 46498,
  preferredRegions: ["东北"],
  rejectedSchoolProvinces: ["四川"],
  distancePreference: "far_from_home" as const,
  locationStrictness: "hard" as const,
};

const recommendations = {
  chong: [
    {
      id: "a",
      schoolName: "营口理工学院",
      majorName: "专业组101（选科：不限）",
      year: 2025,
      subjectType: "历史类" as const,
      batch: "本科批",
      score: 504,
      rank: 43000,
      quota: 8,
      rankGap: -3498,
      riskLabel: "冲刺",
      reason: "学校所在地：辽宁营口。符合省外院校要求。",
      schoolProvince: "辽宁",
      schoolCity: "营口",
    },
  ],
  wen: [
    {
      id: "b",
      schoolName: "通化师范学院",
      majorName: "专业组102（选科：不限）",
      year: 2025,
      subjectType: "历史类" as const,
      batch: "本科批",
      score: 499,
      rank: 46800,
      quota: 12,
      rankGap: 302,
      riskLabel: "相对匹配",
      reason: "学校所在地：吉林通化。符合地域偏好：东北。",
      schoolProvince: "吉林",
      schoolCity: "通化",
    },
  ],
  bao: [
    {
      id: "c",
      schoolName: "牡丹江师范学院",
      majorName: "专业组103（选科：不限）",
      year: 2025,
      subjectType: "历史类" as const,
      batch: "本科批",
      score: 492,
      rank: 51000,
      quota: 16,
      rankGap: 4502,
      riskLabel: "兜底",
      reason: "学校所在地：黑龙江牡丹江。符合地域偏好：东北。",
      schoolProvince: "黑龙江",
      schoolCity: "牡丹江",
    },
  ],
};

describe("gaokao report card route", () => {
  it("returns 404 for invalid share token", async () => {
    const { GET } = await import("@/app/api/gaokao/reports/[id]/card/route");
    const response = await GET(
      new Request("http://localhost/ai/api/gaokao/reports/report-1/card?s=bad"),
      { params: Promise.resolve({ id: "report-1" }) },
    );

    expect(response.status).toBe(404);
  });

  it("renders a stable jpeg card for a valid signed report", async () => {
    mocks.getPublicGaokaoReport.mockResolvedValue({
      id: "report-1",
      title: "林同学的四川高考志愿初筛报告",
      profile,
      recommendations,
      summary: serializeGaokaoReportContent(
        buildGaokaoReportContent({ profile, recommendations }),
      ),
      createdAt: new Date().toISOString(),
      sharePageUrl: "",
      shareImageUrl: "",
    });
    const token = signResultShareToken("gaokao", "report-1");
    const { GET } = await import("@/app/api/gaokao/reports/[id]/card/route");

    const response = await GET(
      new Request(`http://localhost/ai/api/gaokao/reports/report-1/card?s=${token}`),
      { params: Promise.resolve({ id: "report-1" }) },
    );
    const image = Buffer.from(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(image.byteLength).toBeGreaterThan(20_000);
    expect(image[0]).toBe(0xff);
    expect(image[1]).toBe(0xd8);
  });
});
