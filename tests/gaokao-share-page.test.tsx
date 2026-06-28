import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { createEmptyGaokaoProfile } from "@/features/gaokao/types";
import { signResultShareToken } from "@/lib/auth/result-share-token";

const mocks = vi.hoisted(() => ({
  getPublicGaokaoReport: vi.fn(),
}));

vi.mock("@/features/gaokao/gaokao-repository", () => ({
  getPublicGaokaoReport: mocks.getPublicGaokaoReport,
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

describe("gaokao share page", () => {
  it("opens to the share card and keeps the full report inside the app", async () => {
    mocks.getPublicGaokaoReport.mockResolvedValueOnce({
      id: "report-1",
      title: "林同学的四川高考志愿初筛报告",
      profile: createEmptyGaokaoProfile(),
      recommendations: { chong: [], wen: [], bao: [] },
      summary: "报告结论\n冲稳保候选",
      createdAt: new Date().toISOString(),
      sharePageUrl: "http://localhost/ai/share/gaokao/report-1?s=token",
      shareImageUrl:
        "http://localhost/ai/api/gaokao/reports/report-1/card?s=token",
    });
    const token = signResultShareToken("gaokao", "report-1");
    const { default: GaokaoSharePage } = await import(
      "@/app/share/gaokao/[id]/page"
    );

    const element = await GaokaoSharePage({
      params: Promise.resolve({ id: "report-1" }),
      searchParams: Promise.resolve({ s: token }),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("分享卡片");
    expect(html).toContain("/ai/api/gaokao/reports/report-1/card");
    expect(html).toContain("打开大宜宾 App 查看完整报告");
    expect(html).not.toContain("报告结论");
    expect(html).not.toContain("冲稳保候选");
  });
});
