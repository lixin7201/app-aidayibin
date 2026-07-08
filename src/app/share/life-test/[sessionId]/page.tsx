import { notFound } from "next/navigation";

import { getLifeTestSession } from "@/features/life-test/life-test-service";
import { appPath } from "@/lib/routes";

type Props = {
  params: Promise<{ sessionId: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const dayibinAppUrl =
  process.env.NEXT_PUBLIC_DAYIBIN_APP_DOWNLOAD_URL ??
  "https://a.app.qq.com/o/simple.jsp?pkgname=com.dayibin.forum";

export default async function LifeTestSharePage({ params }: Props) {
  const { sessionId } = await params;
  const session = await getLifeTestSession(sessionId).catch(() => null);

  if (!session?.result) {
    notFound();
  }

  const posterUrl = appPath(`/life-test/poster/${sessionId}`);

  return (
    <main className="min-h-screen bg-[#F7F3EA] px-4 py-5 text-[#173B36]">
      <article className="mx-auto flex w-full max-w-[430px] flex-col items-center">
        <h1 className="sr-only">{session.result.name}</h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterUrl}
          alt={`${session.result.name}结果海报`}
          className="block w-full rounded-[8px] bg-[#123F39] shadow-[0_18px_48px_rgba(23,59,54,0.16)]"
        />
        <section className="mt-4 w-full rounded-[8px] bg-[#173B36] p-4 text-white">
          <h2 className="text-base font-black">打开大宜宾 App 测同款</h2>
          <p className="mt-2 text-sm leading-6 text-white/78">
            微信内可直接查看结果海报。想参与测试或保存更多玩法，请打开大宜宾 App。
          </p>
          <a
            href={dayibinAppUrl}
            className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-[8px] bg-[#FFE1A3] px-4 text-sm font-black text-[#173B36]"
          >
            打开大宜宾 App
          </a>
        </section>
      </article>
    </main>
  );
}
