import { notFound } from "next/navigation";

import { getPublicGaokaoReport } from "@/features/gaokao/gaokao-repository";
import { verifyResultShareToken } from "@/lib/auth/result-share-token";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ s?: string | string[] }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const dayibinAppUrl =
  process.env.NEXT_PUBLIC_DAYIBIN_APP_DOWNLOAD_URL ??
  "https://a.app.qq.com/o/simple.jsp?pkgname=com.dayibin.forum";

export default async function GaokaoSharePage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const rawToken = query.s;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  if (!token || !verifyResultShareToken(token, "gaokao", id)) {
    notFound();
  }

  const report = await getPublicGaokaoReport(id);

  if (!report) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-5 text-[#1f2523]">
      <article className="mx-auto flex w-full max-w-[430px] flex-col items-center">
        <h1 className="sr-only">{report.title}</h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={report.shareImageUrl}
          alt={`${report.title}分享卡片`}
          className="block w-full rounded-[8px] bg-white shadow-[0_18px_48px_rgba(31,37,35,0.12)]"
        />
        <section className="mt-4 w-full rounded-[8px] bg-[#1f2523] p-4 text-white">
          <h2 className="text-base font-black">打开大宜宾 App 查看完整报告</h2>
          <p className="mt-2 text-sm leading-6 text-white/78">
            微信内先展示分享卡片。完整冲稳保明细、专业取舍和风险提醒，请在 App 内查看。
          </p>
          <a
            href={dayibinAppUrl}
            className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-[8px] bg-white px-4 text-sm font-black text-[#1f2523]"
          >
            打开大宜宾 App
          </a>
        </section>
      </article>
    </main>
  );
}
