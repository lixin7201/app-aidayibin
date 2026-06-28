import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicGaokaoReport } from "@/features/gaokao/gaokao-repository";
import { GaokaoReportView } from "@/features/gaokao/gaokao-report-view";
import { verifyResultShareToken } from "@/lib/auth/result-share-token";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ s?: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const dayibinAppUrl =
  process.env.NEXT_PUBLIC_DAYIBIN_APP_DOWNLOAD_URL ??
  "https://a.app.qq.com/o/simple.jsp?pkgname=com.dayibin.forum";

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
      <article className="mx-auto w-full max-w-4xl">
        <header className="border-b border-black/8 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a3a]">
            大宜宾高考填报 AI 助手
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-normal">
            {report.title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#667064]">
            这是一份基于四川历史投档数据和 AI 解读生成的志愿初筛报告，仅供参考。
          </p>
        </header>

        <div className="mt-4">
          <GaokaoReportView
            summary={report.summary}
            profile={report.profile}
            recommendations={report.recommendations}
          />
        </div>

        <section className="mt-4 rounded-[8px] bg-[#1f2523] p-4 text-white">
          <h2 className="text-base font-black">打开大宜宾 App 继续测</h2>
          <p className="mt-2 text-sm leading-6 text-white/78">
            查看完整报告后，可以在大宜宾 App 内继续生成自己的志愿初筛。
          </p>
          <Link
            href={dayibinAppUrl}
            className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-[8px] bg-white px-4 text-sm font-black text-[#1f2523]"
          >
            打开大宜宾 App
          </Link>
        </section>
      </article>
    </main>
  );
}
