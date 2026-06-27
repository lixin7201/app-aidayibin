import { notFound } from "next/navigation";

import { getPublicGenerationById } from "@/features/generation/generation-repository";
import { verifyResultShareToken } from "@/lib/auth/result-share-token";
import { appPath } from "@/lib/routes";

type Props = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    s?: string;
  }>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  const { id } = await params;
  const { s } = await searchParams;

  const isValid = s ? verifyResultShareToken(s, "photo", id) : false;

  if (!isValid) {
    return { title: "页面未找到" };
  }

  return {
    title: "我在大宜宾生成了一张 AI 写真",
    description: "点击查看同款 AI 写真效果",
    openGraph: {
      title: "我在大宜宾生成了一张 AI 写真",
      description: "点击查看同款 AI 写真效果",
      type: "website",
    },
  };
}

export default async function SharePhotoPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { s } = await searchParams;

  if (!s || !verifyResultShareToken(s, "photo", id)) {
    notFound();
  }

  const generation = await getPublicGenerationById(id);

  if (!generation || generation.status !== "succeeded" || !generation.publicImageUrl) {
    notFound();
  }

  const imageUrl = generation.publicImageUrl;

  return (
    <main className="flex min-h-screen flex-col items-center bg-[var(--background)] px-4 py-8 text-[var(--foreground)]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-black">我在大宜宾生成了一张 AI 写真</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            点击查看同款 AI 写真效果
          </p>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-[var(--soft-border)] bg-[var(--surface-strong)] shadow-lg">
          <div className="relative aspect-[3/4] bg-[var(--chip-surface)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="AI 写真"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <a
          href={appPath("/photo")}
          className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-[24px] bg-[#8d6bff] px-4 font-black text-white shadow-xl shadow-[#8d6bff]/28 transition hover:-translate-y-0.5 hover:bg-[#7f5cff]"
        >
          我也生成 AI 写真
        </a>
      </div>
    </main>
  );
}
