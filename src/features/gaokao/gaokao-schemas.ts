import { z } from "zod";

export const gaokaoProfileSchema = z.object({
  province: z.literal("四川").default("四川"),
  examYear: z.literal(2026).default(2026),
  subjectType: z.enum(["物理类", "历史类"]).nullable().default(null),
  score: z.number().int().min(0).max(750).nullable().default(null),
  rank: z.number().int().min(1).max(1_000_000).nullable().default(null),
  batch: z.string().trim().max(80).nullable().default(null),
  preferredMajors: z.array(z.string().trim().min(1).max(40)).default([]),
  rejectedMajors: z.array(z.string().trim().min(1).max(40)).default([]),
  preferredCities: z.array(z.string().trim().min(1).max(40)).default([]),
  rejectedCities: z.array(z.string().trim().min(1).max(40)).default([]),
  riskPreference: z.enum(["aggressive", "balanced", "safe"]).default("balanced"),
  tuitionLimit: z.number().int().min(0).max(500_000).nullable().default(null),
  acceptPrivate: z.boolean().nullable().default(null),
  acceptSinoForeign: z.boolean().nullable().default(null),
  acceptAdjustment: z.boolean().nullable().default(null),
  notes: z.string().trim().max(1000).nullable().default(null),
});

export const gaokaoChatSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  profile: gaokaoProfileSchema.partial().optional(),
});

export const gaokaoRecommendSchema = z.object({
  profile: gaokaoProfileSchema,
});

const gaokaoRecommendationItemSchema = z.object({
  id: z.string().min(1),
  schoolName: z.string().min(1),
  majorName: z.string().nullable(),
  year: z.number().int(),
  subjectType: z.enum(["物理类", "历史类"]),
  batch: z.string().nullable(),
  score: z.number().int().nullable(),
  rank: z.number().int().nullable(),
  quota: z.number().int().nullable(),
  rankGap: z.number().int().nullable(),
  riskLabel: z.string().min(1),
  reason: z.string().min(1),
});

export const gaokaoRecommendationsSchema = z.object({
  chong: z.array(gaokaoRecommendationItemSchema),
  wen: z.array(gaokaoRecommendationItemSchema),
  bao: z.array(gaokaoRecommendationItemSchema),
});

export const createGaokaoReportSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  profile: gaokaoProfileSchema,
  summary: z.string().trim().min(1).max(8000),
  recommendations: gaokaoRecommendationsSchema,
});

export type GaokaoProfileInput = z.infer<typeof gaokaoProfileSchema>;
