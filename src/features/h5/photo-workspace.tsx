"use client";

import {
  Camera,
  Download,
  History,
  ImagePlus,
  Loader2,
  RefreshCw,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import NextImage from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";

import type {
  AgeRangeOption,
  GenderOption,
  GenerationTask,
  ImageRatio,
} from "@/features/generation/types";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiPath, assetPath } from "@/lib/routes";
import { createClientId } from "@/lib/utils/client-id";
import { cn } from "@/lib/utils/cn";
import type { PublicPhotoTemplate } from "@/features/templates/types";

type QuotaSnapshot = {
  dailyLimit: number;
  dailySuccessCount: number;
  dailyRemaining: number;
  campaignLimit: number;
  campaignSuccessCount: number;
  campaignRemaining: number;
  dailySubmitLimit: number;
  dailySubmitCount: number;
  hasRunningTask: boolean;
  platformDailyLimit: number;
  platformDailySuccessCount: number;
  platformDailyRemaining: number;
  isUnlimited: boolean;
};

type CurrentUserProfile = {
  nickname: string;
  avatarUrl: string | null;
};

type UploadedPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

export type PhotoWorkspaceProps = {
  templates: PublicPhotoTemplate[];
  quota: QuotaSnapshot;
  selectedTemplateId: string;
  gender: GenderOption;
  ratio: ImageRatio;
  ageRange: AgeRangeOption;
  currentUser: CurrentUserProfile | null;
  onSelectedTemplateIdChange: (value: string) => void;
  onGenderChange: (value: GenderOption) => void;
  onRatioChange: (value: ImageRatio) => void;
};

const genderLabels: Record<GenderOption, string> = {
  female: "女",
  male: "男",
  unspecified: "不透露",
};

const visibleGenderOptions: GenderOption[] = ["female", "male"];
const templatePreviewPriorityCount = 6;
const templateTapMoveThreshold = 10;

export function PhotoWorkspace({
  templates,
  quota,
  selectedTemplateId,
  gender,
  ratio,
  ageRange,
  currentUser,
  onSelectedTemplateIdChange,
  onGenderChange,
  onRatioChange,
}: PhotoWorkspaceProps) {
  const [currentQuota, setQuota] = useState(quota);
  const [profile, setProfile] = useState(currentUser);
  const [generations, setGenerations] = useState<GenerationTask[]>([]);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [notice, setNotice] = useState("上传 1-4 张清晰单人照，就可以开始生成。");
  const templatePointerStart = useRef<{ id: string; x: number; y: number } | null>(
    null,
  );
  const handledPointerTap = useRef(false);
  const photosRef = useRef<UploadedPhoto[]>([]);
  const filteredTemplates = useMemo(
    () =>
      gender === "unspecified"
        ? templates
        : templates.filter((template) => template.genderOptions.includes(gender)),
    [gender, templates],
  );
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId),
    [selectedTemplateId, templates],
  );
  const runningTask = generations.find(
    (task) => task.status === "pending" || task.status === "processing",
  );
  const hasRunningTask = Boolean(runningTask) || currentQuota.hasRunningTask;

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(
    () => () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    },
    [],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      void refreshData({ includeGenerations: historyVisible });
    }, 12000);

    return () => clearInterval(timer);
  }, [historyVisible]);

  useEffect(() => {
    function handleAuthReady(event: Event) {
      const detail = (event as CustomEvent<CurrentUserProfile>).detail;

      if (detail) {
        setProfile(detail);
      }

      void refreshData({ includeGenerations: historyVisible });
    }

    window.addEventListener("aidayibin:auth-ready", handleAuthReady);

    return () =>
      window.removeEventListener("aidayibin:auth-ready", handleAuthReady);
  }, [historyVisible]);

  async function refreshData(options: { includeGenerations?: boolean } = {}) {
    const quotaResponse = await fetch(apiPath("/quota")).catch(() => null);

    if (quotaResponse?.ok) {
      const quotaPayload = (await quotaResponse.json()) as { quota: QuotaSnapshot };
      setQuota(quotaPayload.quota);
    }

    if (!options.includeGenerations) {
      return;
    }

    const generationsResponse = await fetch(apiPath("/generations")).catch(
      () => null,
    );

    if (generationsResponse?.ok) {
      const generationPayload = (await generationsResponse.json()) as {
        generations: GenerationTask[];
      };
      setGenerations(generationPayload.generations);
    }
  }

  async function showHistory() {
    setHistoryVisible(true);
    await refreshData({ includeGenerations: true });
  }

  async function handleFiles(files: FileList | null) {
    const selectedFiles = Array.from(files ?? []).slice(0, 4 - photos.length);

    if (selectedFiles.length === 0) {
      return;
    }

    const nextPhotos = [...photos];

    for (const file of selectedFiles) {
      const compressed = await compressImage(file);
      nextPhotos.push({
        id: createClientId("portrait-photo"),
        file: compressed,
        previewUrl: URL.createObjectURL(compressed),
      });
    }

    setPhotos(nextPhotos.slice(0, 4));
    setNotice(`已选择 ${Math.min(nextPhotos.length, 4)} 张照片，可以继续选择或一键生成。`);
  }

  function chooseTemplate(template: PublicPhotoTemplate) {
    onSelectedTemplateIdChange(template.id);
    onRatioChange(template.recommendedRatios[0] ?? "3:4");
  }

  function selectGender(nextGender: GenderOption) {
    onGenderChange(nextGender);

    const nextTemplates =
      nextGender === "unspecified"
        ? templates
        : templates.filter((template) => template.genderOptions.includes(nextGender));
    const currentTemplate = nextTemplates.find(
      (template) => template.id === selectedTemplateId,
    );

    if (!currentTemplate && nextTemplates[0]) {
      chooseTemplate(nextTemplates[0]);
    }
  }

  function handleTemplatePointerDown(
    event: PointerEvent<HTMLButtonElement>,
    templateId: string,
  ) {
    templatePointerStart.current = {
      id: templateId,
      x: event.clientX,
      y: event.clientY,
    };
    handledPointerTap.current = false;
  }

  function handleTemplatePointerUp(
    event: PointerEvent<HTMLButtonElement>,
    template: PublicPhotoTemplate,
  ) {
    const start = templatePointerStart.current;
    templatePointerStart.current = null;

    if (!start || start.id !== template.id) {
      return;
    }

    const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);

    if (distance <= templateTapMoveThreshold) {
      handledPointerTap.current = true;
      chooseTemplate(template);
      window.setTimeout(() => {
        handledPointerTap.current = false;
      }, 0);
    }
  }

  function removePhoto(photoId: string) {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === photoId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((photo) => photo.id !== photoId);
    });
  }

  function clearPhotos() {
    setPhotos((current) => {
      current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
      return [];
    });
  }

  async function submit() {
    if (!selectedTemplate) return;
    if (photos.length < 1) {
      setNotice("请先上传 1 张清晰单人照片。");
      return;
    }
    if (!currentQuota.isUnlimited && hasRunningTask) {
      setNotice("你已有一张图片正在生成，请稍后查看。");
      return;
    }
    if (!currentQuota.isUnlimited && currentQuota.dailyRemaining <= 0) {
      setNotice("今天的 2 张写真体验次数已用完，明天再来试试。");
      return;
    }
    if (!currentQuota.isUnlimited && currentQuota.campaignRemaining <= 0) {
      setNotice("累计 10 张写真体验次数已用完。");
      return;
    }
    if (
      !currentQuota.isUnlimited &&
      currentQuota.dailySubmitCount >= currentQuota.dailySubmitLimit
    ) {
      setNotice("今天提交次数较多，请明天再来试试。");
      return;
    }
    if (!currentQuota.isUnlimited && currentQuota.platformDailyRemaining <= 0) {
      setNotice("今日体验名额已满，请明天再来试试。");
      return;
    }

    setIsSubmitting(true);
    setNotice("正在上传照片并提交生成任务。");

    try {
      const imageUrls = await uploadPhotos(photos);
      const response = await fetch(apiPath("/generations"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          ratio,
          age_range: ageRange,
          gender,
          image_urls: imageUrls,
        }),
      });

      if (!response.ok) {
        throw new Error("提交失败");
      }

      clearPhotos();
      setNotice("提交成功，图片正在生成中。");
      await refreshData({ includeGenerations: historyVisible });
    } catch {
      setNotice("提交失败，请稍后再试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-4 text-[var(--foreground)] sm:px-6 sm:py-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-5xl flex-col">
        <header className="relative min-h-12 pr-24">
          <div className="absolute right-0 top-0 z-20 flex items-center gap-2">
            <UserPill currentUser={profile} />
            <ThemeToggle />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
              大宜宾 AI Studio
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:mt-3 sm:text-5xl">
              AI 写真
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:mt-4 sm:text-base sm:leading-7">
              上传 1-4 张清晰单人照即可体验，每日最多生成 2 张，累计生成 10 张。
            </p>
          </div>
        </header>

        <div className="grid flex-1 gap-4 py-4 sm:gap-6 sm:py-6 xl:grid-cols-[minmax(0,1.32fr)_430px] xl:items-start">
          <div className="space-y-4 sm:space-y-6">
            <section className="relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)]/78 p-4 shadow-[0_18px_50px_rgba(102,76,160,0.14)] backdrop-blur-xl sm:rounded-[36px] sm:p-7 sm:shadow-[0_30px_90px_rgba(102,76,160,0.18)] lg:p-8">
              <div className="pointer-events-none absolute right-[-80px] top-[-120px] h-72 w-72 rounded-full bg-[#bda8ff]/45 blur-3xl" />
              <div className="pointer-events-none absolute bottom-[-120px] left-[18%] h-72 w-72 rounded-full bg-[#ffc7dc]/45 blur-3xl" />
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--soft-border)] bg-[var(--chip-surface)] px-3 py-1.5 text-xs font-bold text-[var(--primary)] sm:py-2 sm:text-sm">
                  <Camera size={17} />
                  写实风 · 人脸一致性优先
                </div>
                <h2 className="mt-3 max-w-2xl text-2xl font-black leading-tight tracking-normal text-[var(--foreground)] sm:mt-5 sm:text-5xl sm:leading-[1.05] sm:tracking-[-0.04em] lg:text-6xl">
                  选一个模板，快速开始生成
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)] sm:mt-4 sm:text-base sm:leading-7">
                  上传 1-4 张清晰单人照即可体验，每日最多生成 2 张，累计生成 10 张。
                </p>
              </div>
            </section>

            <section className="rounded-[36px] border border-[var(--border)] bg-[var(--surface-strong)]/82 p-5 shadow-[0_24px_70px_rgba(102,76,160,0.12)] backdrop-blur-xl">
              <SectionTitle
                icon={<Upload size={18} />}
                title="上传照片"
                subtitle="选择 1-4 张清晰单人照"
              />
              <div className="mt-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-black text-[var(--foreground)]">模板选择</p>
                  <div className="flex rounded-2xl bg-[var(--chip-surface)] p-1">
                    {visibleGenderOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={cn(
                          "h-9 rounded-xl px-4 text-sm font-black transition",
                          gender === option
                            ? "bg-[var(--surface-strong)] text-[var(--primary)] shadow-sm"
                            : "text-[var(--muted)]",
                        )}
                        onClick={() => selectGender(option)}
                      >
                        {genderLabels[option]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="portrait-template-rail">
                  {filteredTemplates.map((template, index) => (
                    <button
                      key={template.id}
                      type="button"
                      className={cn(
                        "overflow-hidden rounded-[20px] border bg-[var(--surface-strong)] text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg",
                        template.id === selectedTemplateId
                          ? "border-[#8d6bff] ring-2 ring-[#8d6bff]/28"
                          : "border-[var(--soft-border)]",
                      )}
                      aria-pressed={template.id === selectedTemplateId}
                      onPointerDown={(event) =>
                        handleTemplatePointerDown(event, template.id)
                      }
                      onPointerCancel={() => {
                        templatePointerStart.current = null;
                      }}
                      onPointerUp={(event) => handleTemplatePointerUp(event, template)}
                      onClick={() => {
                        if (handledPointerTap.current) {
                          handledPointerTap.current = false;
                          return;
                        }
                        chooseTemplate(template);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          chooseTemplate(template);
                        }
                      }}
                    >
                      <span className="relative block aspect-[3/4] bg-[var(--template-placeholder)]">
                        <NextImage
                          src={assetPath(template.coverUrl)}
                          alt={template.name}
                          fill
                          sizes="(max-width: 640px) 30vw, 160px"
                          className="object-cover"
                          priority={index < templatePreviewPriorityCount}
                        />
                      </span>
                      <span className="block p-3">
                        <span className="block truncate text-sm font-black text-[var(--foreground)]">
                          {template.name}
                        </span>
                        <span className="mt-1 block truncate text-xs font-bold text-[var(--muted)]">
                          {template.tagline}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
                {filteredTemplates.length > templatePreviewPriorityCount ? (
                  <p className="mt-2 text-xs font-bold text-[var(--muted)]">
                    左右滑动查看更多模板
                  </p>
                ) : null}
              </div>
              <label className="mt-4 flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-[30px] border-2 border-dashed border-[var(--soft-border)] bg-[var(--soft-surface)] p-6 text-center transition hover:border-[var(--primary)] hover:bg-[var(--soft-surface-strong)]">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(event) => {
                    void handleFiles(event.currentTarget.files);
                    event.currentTarget.value = "";
                  }}
                />
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-strong)] text-[var(--primary)] shadow-sm">
                  <ImagePlus size={24} />
                </span>
                <span className="mt-4 text-base font-black text-[var(--foreground)]">
                  点击上传照片
                </span>
                <span className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  JPG / PNG / WEBP，最多 4 张
                </span>
              </label>

              {photos.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[var(--template-placeholder)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.previewUrl}
                        alt="预览"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"
                        onClick={() => removePhoto(photo.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 rounded-[24px] bg-[var(--panel-surface)] p-4 text-sm leading-6 text-[var(--muted)]">
                {notice}
              </div>

              <button
                type="button"
                className="mt-4 inline-flex h-13 w-full items-center justify-center gap-2 rounded-[24px] bg-[#8d6bff] px-4 font-black text-white shadow-xl shadow-[#8d6bff]/28 transition hover:-translate-y-0.5 hover:bg-[#7f5cff] disabled:cursor-not-allowed disabled:bg-[#c9bddf] disabled:shadow-none"
                disabled={isSubmitting || (!currentQuota.isUnlimited && hasRunningTask)}
                onClick={() => void submit()}
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {!currentQuota.isUnlimited && hasRunningTask ? "已有图片生成中" : "一键生成写真"}
              </button>
            </section>
          </div>

          <aside className="space-y-4 sm:space-y-6">
            <section className="rounded-[36px] border border-[var(--border)] bg-[var(--surface-strong)]/82 p-5 shadow-[0_24px_70px_rgba(102,76,160,0.12)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <SectionTitle icon={<History size={18} />} title="生成记录" subtitle="点击后再加载" />
                <button
                  type="button"
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl bg-[var(--action-surface)] px-4 font-black text-[var(--primary)]"
                  onClick={() =>
                    historyVisible ? setHistoryVisible(false) : void showHistory()
                  }
                >
                  {historyVisible ? "收起" : "展开"}
                </button>
              </div>

              {historyVisible ? (
                <>
                  <button
                    type="button"
                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-2xl bg-[var(--action-surface)] px-4 font-black text-[var(--primary)]"
                    onClick={() => void refreshData({ includeGenerations: true })}
                  >
                    <RefreshCw size={16} /> 刷新
                  </button>

                  {generations.length === 0 ? (
                    <div className="mt-4 rounded-[28px] border border-[var(--soft-border)] bg-[var(--panel-surface)] p-5 text-sm leading-6 text-[var(--muted)]">
                      还没有生成记录。
                    </div>
                  ) : (
                    <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-1">
                      {generations.map((task) => (
                        <GenerationCard
                          key={task.id}
                          task={task}
                          onDeleted={() =>
                            void refreshData({ includeGenerations: true })
                          }
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-4 rounded-[28px] border border-dashed border-[var(--soft-border)] bg-[var(--panel-surface)] p-5 text-sm leading-6 text-[var(--muted)]">
                  生成记录默认不占首屏，点“展开”后再查看。
                </div>
              )}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function UserPill({ currentUser }: { currentUser: CurrentUserProfile | null }) {
  const nickname = currentUser?.nickname || "大宜宾用户";
  const fallbackText = nickname.trim().slice(0, 1) || "大";

  return (
    <div
      className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-strong)]/86 shadow-sm backdrop-blur"
      title={nickname}
      aria-label={nickname}
    >
      <span className="relative flex h-full w-full shrink-0 overflow-hidden rounded-full bg-[var(--chip-surface)] text-sm font-black text-[var(--primary)]">
        {currentUser?.avatarUrl ? (
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

function GenerationCard({
  task,
  onDeleted,
}: {
  task: GenerationTask;
  onDeleted: () => void;
}) {
  const isDone = task.status === "succeeded" && Boolean(task.storedImageUrl);
  const isProcessing = task.status === "pending" || task.status === "processing";
  const imageUrl = apiPath(`/generations/${task.id}/image`);

  return (
    <article className="group overflow-hidden rounded-[24px] border border-[var(--soft-border)] bg-[var(--surface-strong)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[3/4] bg-[var(--chip-surface)]">
        {isDone ? (
          <NextImage src={imageUrl} alt={task.templateName} fill className="object-cover" sizes="220px" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--muted)]">
            {isProcessing ? "生成中" : task.status === "failed" ? "失败" : "等待中"}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-bold text-[var(--muted)]">{task.templateName}</p>
        <p className="mt-1 text-sm font-black text-[var(--foreground)]">
          {task.ratio} · {task.resolution}
        </p>
        <div className="mt-3 flex gap-2">
          {isDone ? (
            <a className="inline-flex h-8 items-center gap-1 rounded-xl bg-[var(--action-surface)] px-3 text-xs font-black text-[var(--primary)]" href={imageUrl} target="_blank" rel="noreferrer">
              <Download size={12} /> 查看
            </a>
          ) : null}
          <button type="button" className="inline-flex h-8 items-center gap-1 rounded-xl bg-[var(--panel-surface)] px-3 text-xs font-black text-[var(--muted)]" onClick={onDeleted}>
            <RefreshCw size={12} /> 刷新
          </button>
        </div>
      </div>
    </article>
  );
}

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
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--template-placeholder)] text-[var(--primary)]">
        {icon}
      </span>
      <div>
        <h2 className="text-base font-black text-[var(--foreground)]">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{subtitle}</p> : null}
      </div>
    </div>
  );
}

async function uploadPhotos(photos: UploadedPhoto[]) {
  const urls: string[] = [];

  for (const photo of photos) {
    const formData = new FormData();
    formData.append("file", photo.file);

    const response = await fetch(apiPath("/uploads"), {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json()) as {
      file_url?: string;
      error?: { message?: string };
    };

    if (!response.ok) {
      throw new Error(payload.error?.message ?? "upload failed");
    }

    if (!payload.file_url) {
      throw new Error("upload failed");
    }

    urls.push(payload.file_url);
  }

  return urls;
}

async function compressImage(file: File) {
  if (file.size <= 2.5 * 1024 * 1024) {
    return file;
  }

  try {
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
  } catch {
    return file;
  }
}
