import { z } from "zod";

import { imageRatios, resolutionOptions } from "@/features/generation/types";
import { fortuneTypes } from "@/features/fortune/types";

export const createFortuneGenerationSchema = z.object({
  type: z.enum(fortuneTypes),
  image_urls: z.array(z.string().url()).min(1).max(1),
  ratio: z.enum(imageRatios).default("3:4"),
  resolution: z.enum(resolutionOptions).default("2k"),
});

export type CreateFortuneGenerationInput = z.infer<
  typeof createFortuneGenerationSchema
>;
