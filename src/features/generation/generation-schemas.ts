import { z } from "zod";

import {
  ageRangeOptions,
  genderOptions,
  imageRatios,
  resolutionOptions,
} from "@/features/generation/types";

export const createGenerationSchema = z.object({
  template_id: z.string().min(1),
  image_urls: z.array(z.string().url()).min(1).max(4),
  gender: z.enum(genderOptions),
  age_range: z.enum(ageRangeOptions),
  ratio: z.enum(imageRatios),
  resolution: z.enum(resolutionOptions).default("1k"),
});

export const createUploadSignSchema = z.object({
  file_name: z.string().min(1).max(160),
  content_type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  file_size: z.number().int().positive().max(15 * 1024 * 1024),
});

export type CreateGenerationInput = z.infer<typeof createGenerationSchema>;
