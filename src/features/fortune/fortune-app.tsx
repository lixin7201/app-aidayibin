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
import { SaveImageOverlay } from "@/components/save-image-overlay";
import {
  saveImageToPhone,
  SaveImageState,
  shareImage,
  withPreviewImageAccess,
} from "@/lib/qfh5-actions";
import { apiPath } from "@/lib/routes";
import { createClientId } from "@/lib/utils/client-id";
import { cn } from "@/lib/utils/cn";
import { compressImageForUpload } from "@/lib/utils/image-compression";

type Props = {
  initialQuota: FortuneQuotaSnapshot;
  initialGenerations: FortuneGenerationTask[];
  currentUser: CurrentUserProfile | null;
};

type CurrentUserProfile = {
  nickname: string;
  avatarUrl: string | null;
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
const appVisibleEventName = "aidayibin:app-visible";

export function FortunePageApp(props: Props) {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <FortuneApp {...props} />
    </main>
  );
}

export function FortuneApp({
  initialQuota,
  initialGenerations,
  currentUser,
}: Props) {
  const [quota, setQuota] = useState(initialQuota);
  const [generations, setGenerations] = useState(initialGenerations);
  const [profile, setProfile] = useState(currentUser);
  const [selectedType, setSelectedType] = useState<FortuneType>("palm");
  const [photo, setPhoto] = useState<UploadedPhoto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState(
    "上传 1 张清晰手掌照片，生成掌纹命运走势报告图。",
  );
  const runningTask = generations.find(
    (task) => task.status === "pending" || task.status === "processing",
  );
  const selectedMode = fortuneModes.find((mode) => mode.type === selectedType)!;
  const hasUsedExperience =
    Boolean(profile) && !quota.isUnlimited && quota.campaignRemaining <= 0;
  const statusText = quota.isUnlimited
    ? "体验不限"
    : hasUsedExperience
      ? "已体验"
      : "可体验";

  useEffect(() => {
    const timer = setInterval(() => {
      void refreshData();
    }, runningTask ? 5000 : 15000);

    return () => clearInterval(timer);
  }, [runningTask]);

  useEffect(() => {
    generations
      .filter((task) => task.status === "succeeded" && task.storedImageUrl)
      .slice(0, 6)
      .forEach((task) => {
        const preview = new window.Image();
        preview.src =
          task.previewImageUrl ??
          withPreviewImageAccess(apiPath(`/fortune/generations/${task.id}/image`));
      });
  }, [generations]);

  useEffect(() => {
    function handleAuthReady(event: Event) {
      const detail = (event as CustomEvent<CurrentUserProfile>).detail;

      if (detail) {
        setProfile(detail);
      }

      void refreshData();
    }

    window.addEventListener("aidayibin:auth-ready", handleAuthReady);

    return () =>
      window.removeEventListener("aidayibin:auth-ready", handleAuthReady);
  }, []);

  useEffect(() => {
    function handleAppVisible() {
      void refreshData();
    }

    window.addEventListener(appVisibleEventName, handleAppVisible);

    return () => window.removeEventListener(appVisibleEventName, handleAppVisible);
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

  async function refreshQuota() {
    const response = await fetch(apiPath("/fortune/generations")).catch(
      () => null,
    );

    if (!response?.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      generations: FortuneGenerationTask[];
      quota: FortuneQuotaSnapshot;
    };
    setGenerations(payload.generations);
    setQuota(payload.quota);

    return payload.quota;
  }

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];

    if (!file) {
      return;
    }

    const compressed = await compressImageForUpload(file);
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

    const latestQuota = await refreshQuota();

    if (!latestQuota) {
      setNotice("正在同步登录信息，请稍后再试。");
      return;
    }

    if (!profile) {
      setNotice("正在同步登录信息，请稍后再试。");
      return;
    }

    if (!latestQuota.isUnlimited && latestQuota.campaignRemaining <= 0) {
      setNotice("你已经体验过一次了，快来邀请朋友一起测试吧。");
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

      setNotice("已提交生成。完成后会出现在记录里，快来邀请朋友一起测试吧。");
      setPhoto(null);
      await refreshData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "提交失败，请稍后再试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-4 py-3 sm:px-6 lg:px-8 lg:py-6">
      <header className="sticky top-3 z-50 rounded-[20px] border border-[var(--border)] bg-[var(--surface-strong)]/88 px-4 py-2.5 shadow-[0_18px_54px_rgba(55,42,24,0.12)] backdrop-blur-xl sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                大宜宾 AI Studio
              </p>
              <h1 className="text-lg font-black tracking-tight text-[var(--foreground)] sm:text-2xl">
                AI 算命
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <UserPill currentUser={profile} />
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
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-[18px] border border-[#eadabb] bg-[#fff9e8] p-2 text-sm shadow-[0_12px_34px_rgba(55,42,24,0.08)]">
        <QuotaPill label="体验状态" value={statusText} />
        <QuotaPill label="生成中" value={runningTask ? "1" : "0"} />
      </div>
      <div className="relative z-10 grid flex-1 gap-4 py-4 xl:grid-cols-[minmax(0,1.25fr)_430px] xl:items-start">
      <div className="space-y-4">
        <section className="relative overflow-hidden rounded-[22px] border border-[var(--border)] bg-[#f6efd9] p-4 shadow-[0_18px_54px_rgba(55,42,24,0.12)] sm:p-6 lg:p-7">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(48,67,62,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(48,67,62,0.06)_1px,transparent_1px)] bg-[size:42px_42px]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#b88b50] bg-[#fff9e8] px-3 py-1.5 text-xs font-bold text-[var(--accent)]">
              <ImagePlus size={17} />
              AI 算命 · 传统文化娱乐体验
            </div>
            <h2 className="mt-3 max-w-2xl text-2xl font-black leading-tight tracking-normal text-[var(--foreground)] sm:text-4xl lg:text-5xl">
              AI 看手相
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6e6048] sm:text-base">
              上传手掌照片，生成适合分享的掌纹命运走势报告。结果仅供娱乐参考。
            </p>
          </div>
        </section>

        <section className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-strong)] p-3 shadow-[0_14px_40px_rgba(55,42,24,0.08)] sm:p-4">
          <SectionTitle
            icon={<ImagePlus size={18} />}
            title="选择栏目"
            subtitle="后续会加入更多玩法"
          />
          <div className="mt-3 grid gap-2">
            {visibleFortuneModes.map((mode) => (
              <button
                type="button"
                key={mode.type}
                className={cn(
                  "flex items-center gap-3 rounded-[16px] border px-3 py-2.5 text-left transition hover:-translate-y-0.5",
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
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#27362f] text-[#f6efd9]">
                  {mode.icon}
                </span>
                <span>
                  <span className="block text-sm font-black text-[var(--foreground)]">
                    {mode.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-[#6e6048]">
                    {mode.description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-32">
        <section className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-[0_18px_54px_rgba(55,42,24,0.10)]">
          <SectionTitle
            icon={selectedMode.icon}
            title={selectedMode.title}
            subtitle={selectedMode.description}
          />

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
            {hasUsedExperience && !runningTask
              ? "你已经生成过 AI 算命报告啦，快来邀请朋友一起测试吧。"
              : notice}
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
              {generations.map((task, index) => (
                <FortuneGenerationCard
                  key={task.id}
                  task={task}
                  priority={index < 4}
                  onDeleted={() => void refreshData()}
                />
              ))}
            </div>
          )}
        </section>
      </aside>
      </div>
    </section>
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

function UserPill({ currentUser }: { currentUser: CurrentUserProfile | null }) {
  if (!currentUser) {
    return (
      <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)]/86 px-3 py-1.5 text-xs font-bold text-[var(--primary)] shadow-sm backdrop-blur">
        登录后体验
      </span>
    );
  }

  const nickname = currentUser.nickname || "大宜宾用户";
  const fallbackText = nickname.trim().slice(0, 1) || "大";

  return (
    <div
      className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-strong)]/86 shadow-sm backdrop-blur"
      title={nickname}
      aria-label={nickname}
    >
      <span className="relative flex h-full w-full shrink-0 overflow-hidden rounded-full bg-[var(--chip-surface)] text-sm font-black text-[var(--primary)]">
        {currentUser.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUser.avatarUrl}
            alt={nickname}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            {fallbackText}
          </span>
        )}
      </span>
    </div>
  );
}

function FortuneGenerationCard({
  task,
  priority,
  onDeleted,
}: {
  task: FortuneGenerationTask;
  priority: boolean;
  onDeleted: () => void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [saveStage, setSaveStage] = useState<SaveImageState | null>(null);
  const isReady = task.status === "succeeded" && task.publicImageUrl;
  const previewUrl =
    task.previewImageUrl ??
    withPreviewImageAccess(apiPath(`/fortune/generations/${task.id}/image`));
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
    if (!task.sharePageUrl || !task.publicImageUrl || isSharing) {
      return;
    }

    setIsSharing(true);
    try {
      const sharePageUrl = task.sharePageUrl;
      const shareImageUrl =
        task.thumbImageUrl ?? task.cardImageUrl ?? task.publicImageUrl;
      const title = "我在大宜宾生成了一张 AI 报告图";
      const description = "点击查看你的专属趣味报告";

      await shareImage({
        title,
        description,
        imageUrl: shareImageUrl,
        pageUrl: sharePageUrl,
      });
    } finally {
      setIsSharing(false);
    }
  }

  async function handleSave() {
    if (!task.publicImageUrl) return;
    setIsSaving(true);
    setSaveStage({ stage: "preparing", message: "正在准备图片，请稍候" });
    try {
      const result = await saveImageToPhone({
        url: task.publicImageUrl,
        previewUrl,
        originalUrl: task.originalImageUrl ?? undefined,
        onStateChange: setSaveStage,
      });
      if (result.error !== "app_required") {
        setSaveStage(null);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-[18px] border border-[#e3d4b2] bg-[var(--surface-strong)] shadow-[0_14px_34px_rgba(55,42,24,0.10)]">
      <div className="relative aspect-[3/4] bg-[#f1e4c6]">
        {isReady ? (
          <Image
            src={previewUrl}
            alt={task.typeName}
            fill
            sizes="220px"
            className="object-cover"
            unoptimized
            priority={priority}
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
          <button
            type="button"
            className={cn(
              "inline-flex h-9 flex-1 items-center justify-center rounded-[12px] bg-[#f6efd9] text-[#73583a]",
              !isReady && "pointer-events-none opacity-40",
            )}
            disabled={!isReady || isSaving}
            onClick={() => void handleSave()}
            aria-label="保存图片"
            title="保存图片"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            <span className="ml-1 text-xs font-black">
              {isSaving ? "保存中" : "保存"}
            </span>
          </button>
          <button
            type="button"
            className="inline-flex h-9 flex-1 items-center justify-center rounded-[12px] bg-[#f6efd9] text-[#73583a] disabled:opacity-40"
            disabled={!isReady || isSharing}
            onClick={() => void share()}
            aria-label="分享图片"
            title="分享图片"
          >
            {isSharing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Share2 size={16} />
            )}
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
      {saveStage && (
        <SaveImageOverlay
          state={saveStage}
          onClose={() => setSaveStage(null)}
          onRetry={() => {
            setSaveStage(null);
            void handleSave();
          }}
        />
      )}
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
