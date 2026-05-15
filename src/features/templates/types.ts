import type {
  AgeRangeOption,
  GenderOption,
  ImageRatio,
} from "@/features/generation/types";

export type PhotoTemplate = {
  id: string;
  slug: string;
  name: string;
  category: string;
  coverUrl: string;
  animatedCoverUrl?: string;
  tagline: string;
  description: string;
  prompt: string;
  negativePrompt: string;
  recommendedRatios: ImageRatio[];
  supportedRatios: ImageRatio[];
  genderOptions: GenderOption[];
  ageOptions: AgeRangeOption[];
  sortOrder: number;
  isActive: boolean;
};

export type PublicPhotoTemplate = Omit<
  PhotoTemplate,
  "prompt" | "negativePrompt"
>;
