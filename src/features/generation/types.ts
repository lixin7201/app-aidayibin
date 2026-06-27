export const generationStatuses = [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "canceled",
] as const;

export type GenerationStatus = (typeof generationStatuses)[number];

export const imageRatios = ["1:1", "3:4", "4:5", "9:16", "16:9"] as const;

export type ImageRatio = (typeof imageRatios)[number];

export const resolutionOptions = ["1k", "2k", "4k"] as const;

export type ResolutionOption = (typeof resolutionOptions)[number];

export const genderOptions = ["female", "male", "unspecified"] as const;

export type GenderOption = (typeof genderOptions)[number];

export const ageRangeOptions = [
  "18-25",
  "26-35",
  "36-45",
  "46+",
] as const;

export type AgeRangeOption = (typeof ageRangeOptions)[number];

export type GenerationTask = {
  id: string;
  userId: string;
  templateId: string;
  templateName: string;
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
