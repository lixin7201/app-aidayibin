import type {
  GenerationStatus,
  ImageRatio,
  ResolutionOption,
} from "@/features/generation/types";

export const fortuneTypes = ["palm", "face"] as const;

export type FortuneType = (typeof fortuneTypes)[number];

export type FortuneFeatureType = "fortune_palm" | "fortune_face";

export type FortuneGenerationTask = {
  id: string;
  userId: string;
  type: FortuneType;
  featureType: FortuneFeatureType;
  typeName: string;
  status: GenerationStatus;
  ratio: ImageRatio;
  resolution: ResolutionOption;
  inputImageCount: number;
  storedImageUrl: string | null;
  previewImageUrl: string | null;
  shareImageUrl: string | null;
  thumbImageUrl: string | null;
  publicImageUrl: string | null;
  cardImageUrl: string | null;
  originalImageUrl: string | null;
  sharePageUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

export function getFortuneFeatureType(type: FortuneType): FortuneFeatureType {
  return type === "palm" ? "fortune_palm" : "fortune_face";
}

export function getFortuneTypeName(type: FortuneType) {
  return type === "palm" ? "AI 看手相" : "AI 看面相";
}
