import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicGaokaoReport } from "@/features/gaokao/gaokao-repository";
import type {
  GaokaoRecommendationBucket,
  GaokaoRecommendations,
} from "@/features/gaokao/types";
import { verifyResultShareToken } from "@/lib/auth/result-share-token";
import { appPath } from "@/lib/routes";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ s?: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GaokaoSharePage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const token = query.s;

  if (!token || !verifyResultShareToken(token, "gaokao", id)) {
    notFound();
  }

  const report = await getPublicGaokaoReport(id);

  if (!report) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-6 text-[#1f2523]">
      <article className="mx-auto w-full max-w-3xl">
        <header className="border-b border-black/8 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a3a]">
            大宜宾高考填报 AI 助手
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-normal">
            {report.title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#667064]">
            这是一份基于历史投档数据和 AI 解读生成的志愿初筛报告，仅供参考。
          </p>
        </header>

        <section className="mt-4 rounded-[8px] bg-white p-4 shadow-sm">
          <h2 className="text-base font-black">考生摘要</h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <Info label="省份" value="四川" />
            <Info label="科类" value={report.profile.subjectType ?? "未标注"} />
            <Info label="分数" value={report.profile.score ? `${report.profile.score} 分` : "未标注"} />
            <Info label="位次" value={report.profile.rank ? `${report.profile.rank}` : "未标注"} />
          </dl>
        </section>

        <section className="mt-4 rounded-[8px] bg-white p-4 shadow-sm">
          <h2 className="text-base font-black">报告摘要</h2>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#333b32]">
            {report.summary}
          </div>
        </section>

        <RecommendationPreview recommendations={report.recommendations} />

        <section className="mt-4 rounded-[8px] border border-[#ead2a4] bg-[#fff8e5] p-4 text-sm leading-6 text-[#6d5322]">
          本报告不构成录取承诺。正式填报前，请以四川省教育考试院、阳光高考平台和高校招生章程为准。
        </section>

        <Link
          href={appPath("/gaokao")}
          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-[8px] bg-[#1f2523] px-4 text-sm font-black text-white"
        >
          我也测一份志愿初筛
        </Link>
      </article>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-[8px] bg-[#f5f7f1] px-3 py-2">
      <dt className="text-[#6d766d]">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}

function RecommendationPreview({
  recommendations,
}: {
  recommendations: GaokaoRecommendations;
}) {
  const buckets: Array<{
    key: GaokaoRecommendationBucket;
    title: string;
    tone: string;
  }> = [
    { key: "chong", title: "冲一冲", tone: "bg-[#fff1e8] text-[#8c3f18]" },
    { key: "wen", title: "稳一稳", tone: "bg-[#edf7ed] text-[#276039]" },
    { key: "bao", title: "保一保", tone: "bg-[#eef2ff] text-[#354c91]" },
  ];

  const hasItems = buckets.some((bucket) => recommendations[bucket.key].length > 0);

  if (!hasItems) {
    return (
      <section className="mt-4 rounded-[8px] bg-white p-4 shadow-sm">
        <h2 className="text-base font-black">冲稳保预览</h2>
        <p className="mt-3 text-sm leading-6 text-[#667064]">
          当前原生数据中暂无可展示的四川历史记录，正式填报前需要补齐官方数据后再做细筛。
        </p>
      </section>
    );
  }

  return (
    <section className="mt-4 rounded-[8px] bg-white p-4 shadow-sm">
      <h2 className="text-base font-black">冲稳保预览</h2>
      <div className="mt-3 grid gap-3">
        {buckets.map((bucket) => {
          const items = recommendations[bucket.key].slice(0, 3);

          if (items.length === 0) {
            return null;
          }

          return (
            <div key={bucket.key} className="rounded-[8px] border border-black/8 p-3">
              <div className={`inline-flex rounded-[6px] px-2 py-1 text-xs font-black ${bucket.tone}`}>
                {bucket.title}
              </div>
              <div className="mt-2 space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="text-sm leading-6">
                    <div className="font-bold text-[#222822]">
                      {item.schoolName}
                      {item.majorName ? ` · ${item.majorName}` : ""}
                    </div>
                    <div className="text-xs text-[#667064]">
                      {item.year} 年 / {item.score ? `${item.score} 分` : "分数缺失"} /{" "}
                      {item.rank ? `位次 ${item.rank}` : "位次缺失"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
