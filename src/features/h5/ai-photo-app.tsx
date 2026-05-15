"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import type {
  AgeRangeOption,
  GenderOption,
  ImageRatio,
} from "@/features/generation/types";
import type { PublicPhotoTemplate } from "@/features/templates/types";

const PhotoWorkspace = dynamic(
  () => import("./photo-workspace").then((module) => module.PhotoWorkspace),
  {
    loading: () => (
      <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-8">
        <section className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-5xl items-center justify-center">
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-strong)] px-6 py-10 text-center shadow-[0_18px_50px_rgba(102,76,160,0.12)]">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
              正在打开 AI 写真
            </p>
            <h1 className="mt-3 text-2xl font-black">马上就好</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">首次加载会稍微久一点。</p>
          </div>
        </section>
      </main>
    ),
  },
);

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

type Props = {
  initialTemplates: PublicPhotoTemplate[];
  initialQuota: QuotaSnapshot;
  currentUser: CurrentUserProfile | null;
};

export type PhotoAppState = {
  templates: PublicPhotoTemplate[];
  quota: QuotaSnapshot;
  selectedTemplateId: string;
  gender: GenderOption;
  ratio: ImageRatio;
  ageRange: AgeRangeOption;
};

const initialGender: GenderOption = "female";

export function AiPhotoApp({
  initialTemplates,
  initialQuota,
  currentUser,
}: Props) {
  const initialTemplate =
    initialTemplates.find((template) =>
      template.genderOptions.includes(initialGender),
    ) ?? initialTemplates[0];
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    initialTemplate?.id ?? "",
  );
  const [gender, setGender] = useState<GenderOption>(initialGender);
  const selectedTemplate = useMemo(
    () => initialTemplates.find((template) => template.id === selectedTemplateId),
    [initialTemplates, selectedTemplateId],
  );
  const [ratio, setRatio] = useState<ImageRatio>(
    selectedTemplate?.recommendedRatios[0] ?? "3:4",
  );
  const [ageRange] = useState<AgeRangeOption>("26-35");

  return (
    <PhotoWorkspace
      templates={initialTemplates}
      quota={initialQuota}
      selectedTemplateId={selectedTemplateId}
      gender={gender}
      ratio={ratio}
      ageRange={ageRange}
      currentUser={currentUser}
      onSelectedTemplateIdChange={setSelectedTemplateId}
      onGenderChange={setGender}
      onRatioChange={setRatio}
    />
  );
}
