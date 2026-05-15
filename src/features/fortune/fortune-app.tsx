"use client";

import {
  Clock3,
  Download,
  Eye,
  Hand,
  ImagePlus,
  Loader2,
  RefreshCw,
  Send,
  Share2,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import type { FortuneQuotaSnapshot } from "@/features/fortune/fortune-quota-service";
import type {
  FortuneGenerationTask,
  FortuneType,
} from "@/features/fortune/types";
import { apiPath } from "@/lib/routes";
import { createClientId } from "@/lib/utils/client-id";
import { cn } from "@/lib/utils/cn";

type Props = {
  initialQuota: FortuneQuotaSnapshot;
  initialGenerations: FortuneGenerationTask[];
};

const fortuneModes: Array<{
  type: FortuneType;
  title: string;
  description: string;
  button: string;
  icon: React.ReactNode;
  tips: string[];
}> = [
  {
    type: "palm",
    title: "AI 看手相",
    description: "上传清晰手部照片，生成东方玄学手相分析报告图。",
    button: "生成手相报告",
    icon: <Hand size={19} />,
    tips: [
      "单只手或双手均可",
      "掌纹尽量清晰",
      "光线明亮，手部无遮挡",
      "背景尽量干净",
    ],
  },
  {
    type: "face",
    title: "AI 看面相",
    description: "上传清晰面部照片，生成东方玄学面相分析报告图。",
    button: "生成面相报告",
    icon: <Eye size={19} />,
    tips: [
      "正脸或轻微侧脸更合适",
      "五官无遮挡",
      "不建议戴墨镜、口罩或夸张滤镜",
      "不支持多人合照",
    ],
  },
];

const visibleFortuneModes = fortuneModes.filter((mode) => mode.type === "palm");

export function FortunePageApp(props: Props) {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
        <header className="sticky top-3 z-50 rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)]/88 px-4 py-3 shadow-[0_18px_54px_rgba(55,42,24,0.12)] backdrop-blur-xl sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                大宜宾 AI Studio
              </p>
              <h1 className="text-xl font-black tracking-tight text-[var(--foreground)] sm:text-2xl">
                AI 算命
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <a
                href="#fortune-records"
                className="inline-flex h-11 items-center gap-2 rounded-[16px] bg-[#27362f] px-4 text-sm font-bold text-[#fff7e6] shadow-lg shadow-[#27362f]/18"
                aria-label="查看生成记录"
                title="查看生成记录"
              >
                <Clock3 size={18} />
                <span className="hidden sm:inline">记录</span>
              </a>
            </div>
          </div>
        </header>

        <FortuneApp {...props} />
      </section>
    </main>
  );
}

export function FortuneApp({ initialQuota, initialGenerations }: Props) {
  const [quota, setQuota] = useState(initialQuota);
  const [generations, setGenerations] = useState(initialGenerations);
  const [selectedType, setSelectedType] = useState<FortuneType>("palm");
  const [photo, setPhoto] = useState<UploadedPhoto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState(
    "上传 1 张清晰手掌照片，生成 3:4、2K 的掌纹命运走势报告图。",
  );
  const runningTask = generations.find(
    (task) => task.status === "pending" || task.status === "processing",
  );
  const selectedMode = fortuneModes.find((mode) => mode.type === selectedType)!;

  useEffect(() => {
    const timer = setInterval(() => {
      void refreshData();
    }, 12000);

    return () => clearInterval(timer);
  }, []);

  async function refreshData() {
    const response = await fetch(apiPath("/fortune/generations")).catch(
      () => null,
    );

    if (!response?.ok) {
      return;
    }

    const payload = (await response.json()) as {
      generations: FortuneGenerationTask[];
      quota: FortuneQuotaSnapshot;
    };
    setGenerations(payload.generations);
    setQuota(payload.quota);
  }

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];

    if (!file) {
      return;
    }

    const compressed = await compressImage(file);
    setPhoto({
      id: createClientId("fortune-photo"),
      file: compressed,
      previewUrl: URL.createObjectURL(compressed),
    });
  }

  async function submit() {
    if (!photo) {
      setNotice("请先上传 1 张清晰手掌照片。");
      return;
    }

    if (!quota.isUnlimited && quota.dailyRemaining <= 0) {
      setNotice("今天的 AI 算命体验次数已用完，明天再来试试。");
      return;
    }

    setIsSubmitting(true);
    setNotice("正在上传照片并提交生成任务。");

    try {
      const imageUrls = await uploadPhotos([photo]);
      const response = await fetch(apiPath("/fortune/generations"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          image_urls: imageUrls,
          ratio: "3:4",
          resolution: "2k",
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setNotice(payload.error?.message ?? "提交失败，请稍后再试。");
        return;
      }

      setNotice("已提交生成。完成后会出现在记录里，可下载、分享或删除。");
      setPhoto(null);
      await refreshData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "提交失败，请稍后再试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative z-10 grid flex-1 gap-6 py-6 xl:grid-cols-[minmax(0,1.25fr)_430px] xl:items-start">
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-[#f6efd9] p-5 shadow-[0_24px_70px_rgba(55,42,24,0.14)] sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(48,67,62,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(48,67,62,0.06)_1px,transparent_1px)] bg-[size:42px_42px]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#b88b50] bg-[#fff9e8] px-3 py-2 text-sm font-bold text-[var(--accent)]">
              <ImagePlus size={17} />
              AI 算命 · 传统文化娱乐体验
            </div>
            <h2 className="mt-5 max-w-2xl text-4xl font-black leading-[1.05] tracking-normal text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              上传手掌照片，生成一张适合分享的掌纹命运走势报告
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#6e6048]">
              根据手掌与掌纹生成 3:4、2K 的一生命运走势报告。分析结果仅供娱乐参考，不构成医学、投资、法律或人生决策建议。
            </p>
          </div>
        </section>

        <section className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] p-4 shadow-[0_18px_54px_rgba(55,42,24,0.10)] sm:p-5">
          <SectionTitle
            icon={<ImagePlus size={18} />}
            title="选择栏目"
            subtitle="上传清晰手掌照片，生成掌纹命运走势报告"
          />
          <div className="mt-4 grid gap-3">
            {visibleFortuneModes.map((mode) => (
              <button
                type="button"
                key={mode.type}
                className={cn(
                  "rounded-[18px] border p-4 text-left transition hover:-translate-y-0.5",
                  selectedType === mode.type
                    ? "border-[#9b6b34] bg-[#f2e1bc] shadow-[0_16px_42px_rgba(85,54,22,0.16)]"
                    : "border-[#e3d4b2] bg-[var(--surface-strong)] hover:border-[#b88b50]",
                )}
                onClick={() => {
                  setSelectedType(mode.type);
                  setNotice(
                    `已切换到${mode.title}。上传 1 张清晰手掌照片即可生成报告。`,
                  );
                }}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#27362f] text-[#f6efd9]">
                  {mode.icon}
                </span>
                <h3 className="mt-4 text-lg font-black text-[var(--foreground)]">
                  {mode.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#6e6048]">
                  {mode.description}
                </p>
              </button>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-36">
        <section className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-[0_18px_54px_rgba(55,42,24,0.10)]">
          <SectionTitle
            icon={selectedMode.icon}
            title={selectedMode.title}
            subtitle={selectedMode.description}
          />

          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <QuotaPill
              label="今日剩余"
              value={quota.isUnlimited ? "不限" : `${quota.dailyRemaining}`}
            />
            <QuotaPill
              label="活动剩余"
              value={quota.isUnlimited ? "不限" : `${quota.campaignRemaining}`}
            />
            <QuotaPill label="生成中" value={runningTask ? "1" : "0"} />
          </div>

          <div className="mt-5 rounded-[18px] border border-[#eadabb] bg-[var(--surface-strong)] p-4">
            <p className="text-sm font-black text-[var(--foreground)]">上传要求</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedMode.tips.map((tip) => (
                <span
                  key={tip}
                  className="rounded-full bg-[#f6efd9] px-3 py-1.5 text-xs font-bold text-[#73583a]"
                >
                  {tip}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-[20px] border border-dashed border-[#b88b50] bg-[#fbf4df] px-4 text-center transition hover:bg-[#f6efd9]">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-strong)] text-[var(--accent)] shadow-sm">
                <Upload size={23} />
              </span>
              <span className="mt-3 text-sm font-black text-[var(--foreground)]">
                上传 1 张清晰手掌照片
              </span>
              <span className="mt-1 text-xs leading-5 text-[#75674d]">
                系统会自动压缩，成品固定 3:4、2K
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => void handleFiles(event.target.files)}
              />
            </label>

            {photo ? (
              <div className="mt-3 overflow-hidden rounded-[18px] border border-[#e3d4b2] bg-[var(--surface-strong)] p-2">
                <div className="relative aspect-[3/4] overflow-hidden rounded-[14px] bg-[#f1e4c6]">
                  <Image
                    src={photo.previewUrl}
                    alt="上传预览"
                    fill
                    sizes="380px"
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#27362f]/80 text-white backdrop-blur"
                    aria-label="删除照片"
                    title="删除照片"
                    onClick={() => setPhoto(null)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 rounded-[18px] bg-[#f6efd9] p-4 text-sm leading-6 text-[#6e6048]">
            {notice}
          </div>

          <button
            type="button"
            className="mt-4 inline-flex h-13 w-full items-center justify-center gap-2 rounded-[18px] bg-[#27362f] px-4 font-black text-[#fff7e6] shadow-xl shadow-[#27362f]/20 transition hover:-translate-y-0.5 hover:bg-[#1e2d27] disabled:cursor-not-allowed disabled:bg-[#b6aa92] disabled:shadow-none"
            disabled={isSubmitting || (!quota.isUnlimited && Boolean(runningTask))}
            onClick={() => void submit()}
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
            {!quota.isUnlimited && runningTask ? "已有报告生成中" : selectedMode.button}
          </button>
        </section>

        <section
          id="fortune-records"
          className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-[0_18px_54px_rgba(55,42,24,0.10)]"
        >
          <div className="flex items-start justify-between gap-3">
            <SectionTitle
              icon={<Clock3 size={18} />}
              title="AI 算命记录"
              subtitle="刷新页面后仍可查看成品图"
            />
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f6efd9] text-[#73583a]"
              aria-label="刷新记录"
              title="刷新记录"
              onClick={() => void refreshData()}
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {generations.length === 0 ? (
            <div className="mt-4 rounded-[18px] border border-[#e3d4b2] bg-[var(--surface-strong)] p-5 text-sm leading-6 text-[#6e6048]">
              还没有 AI 算命记录。上传手相照片开始体验吧。
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2">
              {generations.map((task) => (
                <FortuneGenerationCard
                  key={task.id}
                  task={task}
                  onDeleted={() => void refreshData()}
                />
              ))}
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}

type UploadedPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f6efd9] text-[var(--accent)]">
        {icon}
      </span>
      <div>
        <h2 className="text-base font-black text-[var(--foreground)]">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-xs leading-5 text-[#75674d]">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

function QuotaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-[#eadabb] bg-[var(--surface-strong)] px-3 py-2 shadow-sm">
      <p className="text-[11px] font-bold text-[#7c6e55]">{label}</p>
      <p className="mt-0.5 text-lg font-black text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function FortuneGenerationCard({
  task,
  onDeleted,
}: {
  task: FortuneGenerationTask;
  onDeleted: () => void;
}) {
  const isReady = task.status === "succeeded" && task.storedImageUrl;
  const imageUrl = apiPath(`/fortune/generations/${task.id}/image`);
  const statusLabel = {
    pending: "排队中",
    processing: "生成中",
    succeeded: "已完成",
    failed: "失败",
    canceled: "已取消",
  }[task.status];

  async function remove() {
    await fetch(apiPath(`/fortune/generations/${task.id}`), {
      method: "DELETE",
    });
    onDeleted();
  }

  async function share() {
    if (!task.storedImageUrl) {
      return;
    }

    const shareUrl = new URL(imageUrl, window.location.origin).toString();

    if (navigator.share) {
      await navigator.share({
        title: task.typeName,
        url: shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
  }

  return (
    <article className="overflow-hidden rounded-[18px] border border-[#e3d4b2] bg-[var(--surface-strong)] shadow-[0_14px_34px_rgba(55,42,24,0.10)]">
      <div className="relative aspect-[3/4] bg-[#f1e4c6]">
        {isReady ? (
          <Image
            src={imageUrl}
            alt={task.typeName}
            fill
            sizes="220px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-3 text-center text-[#6e6048]">
            {task.status === "failed" ? (
              <Trash2 size={24} />
            ) : (
              <Loader2 size={24} className="animate-spin" />
            )}
            <p className="text-sm font-bold">{task.errorMessage ?? statusLabel}</p>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-[var(--surface-strong)]/90 px-2.5 py-1 text-xs font-bold text-[var(--accent)] backdrop-blur">
          {statusLabel}
        </span>
      </div>
      <div className="p-3">
        <h3 className="truncate text-sm font-black text-[var(--foreground)]">
          {task.typeName}
        </h3>
        <p className="mt-1 text-xs font-medium text-[#7c6e55]">
          {task.ratio} · {task.resolution}
        </p>
        <div className="mt-3 flex gap-2">
          <a
            href={isReady ? imageUrl : "#"}
            download
            className={cn(
              "inline-flex h-9 flex-1 items-center justify-center rounded-[12px] bg-[#f6efd9] text-[#73583a]",
              !isReady && "pointer-events-none opacity-40",
            )}
            aria-label="下载图片"
            title="下载图片"
          >
            <Download size={16} />
          </a>
          <button
            type="button"
            className="inline-flex h-9 flex-1 items-center justify-center rounded-[12px] bg-[#f6efd9] text-[#73583a] disabled:opacity-40"
            disabled={!isReady}
            onClick={() => void share()}
            aria-label="分享图片"
            title="分享图片"
          >
            <Share2 size={16} />
          </button>
          <button
            type="button"
            className="inline-flex h-9 flex-1 items-center justify-center rounded-[12px] bg-[#fff0ed] text-[#b64a3c]"
            onClick={() => void remove()}
            aria-label="删除记录"
            title="删除记录"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}

async function uploadPhotos(photos: UploadedPhoto[]) {
  const urls: string[] = [];

  for (const photo of photos) {
    const formData = new FormData();
    formData.append("file", photo.file);

    const uploadResponse = await fetch(apiPath("/uploads"), {
      method: "POST",
      body: formData,
    });
    const uploadPayload = await uploadResponse.json();

    if (!uploadResponse.ok) {
      throw new Error(uploadPayload.error?.message ?? "图片上传失败，请稍后再试。");
    }

    if (!uploadPayload.file_url) {
      throw new Error("图片上传失败：服务端未返回图片地址。");
    }

    urls.push(uploadPayload.file_url);
  }

  return urls;
}

async function compressImage(file: File) {
  if (file.size <= 2.5 * 1024 * 1024) {
    return file;
  }

  const image = await createImageBitmap(file);
  const maxSide = 1600;
  const scale = Math.min(maxSide / image.width, maxSide / image.height, 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const context = canvas.getContext("2d");

  if (!context) {
    return file;
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.86),
  );

  if (!blob) {
    return file;
  }

  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
    type: "image/jpeg",
  });
}
