import { z } from "zod";

export const lifeTestAnswerSchema = z.object({
  questionId: z.string().min(1),
  optionId: z.string().min(1),
});

export const createLifeTestSessionSchema = z.object({
  anonymousId: z.string().max(191).optional(),
  source: z.string().max(64).optional(),
  campaign: z.string().max(191).optional(),
});

export const completeLifeTestSessionSchema = z.object({
  answers: z.array(lifeTestAnswerSchema),
});

export const lifeTestEventSchema = z.object({
  sessionId: z.string().max(64).optional(),
  eventName: z
    .enum([
      "view_home",
      "start",
      "answer",
      "complete",
      "poster_save",
      "share",
      "job_cta_click",
      "matchmaker_cta_click",
      "lead_submit",
    ]),
  eventData: z.record(z.string(), z.unknown()).optional(),
  source: z.string().max(64).optional(),
  campaign: z.string().max(191).optional(),
});

export const createLifeTestLeadSchema = z.object({
  sessionId: z.string().max(64).optional(),
  leadType: z.enum(["job", "matchmaker", "both"]),
  name: z.string().max(64).optional(),
  mobile: z.string().max(32).optional(),
  wechat: z.string().max(191).optional(),
  note: z.string().max(500).optional(),
  consent: z.boolean(),
  source: z.string().max(64).optional(),
  campaign: z.string().max(191).optional(),
});
