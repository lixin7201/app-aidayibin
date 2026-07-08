import { z } from "zod";

const nullableString = (max: number) => z.string().max(max).nullish();

export const lifeTestAnswerSchema = z.object({
  questionId: z.string().min(1),
  optionId: z.string().min(1),
});

const lifeTestAttributionSchema = z.object({
  source: nullableString(64),
  campaign: nullableString(191),
  campaignId: nullableString(191),
  entryScene: nullableString(64),
  channel: nullableString(64),
  regionCode: nullableString(64),
  shareCode: nullableString(32),
  referrerSessionId: nullableString(64),
  posterVariant: nullableString(64),
});

export const createLifeTestSessionSchema = lifeTestAttributionSchema.extend({
  anonymousId: nullableString(191),
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
      "share_landing",
      "job_cta_click",
      "matchmaker_cta_click",
      "lead_submit",
    ]),
  eventData: z.record(z.string(), z.unknown()).optional(),
}).merge(lifeTestAttributionSchema);

export const createLifeTestLeadSchema = z.object({
  sessionId: nullableString(64),
  leadType: z.enum(["job", "matchmaker", "both"]),
  name: nullableString(64),
  mobile: nullableString(32),
  wechat: nullableString(191),
  note: nullableString(500),
  consent: z.boolean(),
}).merge(lifeTestAttributionSchema);
