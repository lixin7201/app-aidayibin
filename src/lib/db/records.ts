import type {
  AppUser,
  FortuneGenerationTask,
  GenerationTask,
  PhotoTemplate,
  SystemConfig,
} from "@prisma/client";

import type {
  AppUserRecord,
  FortuneGenerationTaskRecord,
  GenerationTaskRecord,
  PhotoTemplateRecord,
  SystemConfigRecord,
} from "@/lib/db/database.types";

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function toAppUserRecord(user: AppUser): AppUserRecord {
  return {
    ...user,
    status: user.status as AppUserRecord["status"],
    created_at: user.created_at.toISOString(),
    updated_at: user.updated_at.toISOString(),
    last_seen_at: toIsoString(user.last_seen_at),
  };
}

export function toPhotoTemplateRecord(
  template: PhotoTemplate,
): PhotoTemplateRecord {
  return {
    ...template,
    recommended_ratios: toStringArray(
      template.recommended_ratios,
    ) as PhotoTemplateRecord["recommended_ratios"],
    supported_ratios: toStringArray(
      template.supported_ratios,
    ) as PhotoTemplateRecord["supported_ratios"],
    gender_options: toStringArray(
      template.gender_options,
    ) as PhotoTemplateRecord["gender_options"],
    age_options: toStringArray(
      template.age_options,
    ) as PhotoTemplateRecord["age_options"],
    created_at: template.created_at.toISOString(),
    updated_at: template.updated_at.toISOString(),
  };
}

export function toGenerationTaskRecord(
  task: GenerationTask,
): GenerationTaskRecord {
  return {
    ...task,
    provider: task.provider as GenerationTaskRecord["provider"],
    status: task.status as GenerationTaskRecord["status"],
    gender: task.gender as GenerationTaskRecord["gender"],
    age_range: task.age_range as GenerationTaskRecord["age_range"],
    ratio: task.ratio as GenerationTaskRecord["ratio"],
    resolution: task.resolution as GenerationTaskRecord["resolution"],
    temp_input_urls: toStringArray(task.temp_input_urls),
    quota_counted_at: toIsoString(task.quota_counted_at),
    lock_until: toIsoString(task.lock_until),
    created_at: task.created_at.toISOString(),
    submitted_at: toIsoString(task.submitted_at),
    completed_at: toIsoString(task.completed_at),
    deleted_at: toIsoString(task.deleted_at),
  };
}

export function toFortuneGenerationTaskRecord(
  task: FortuneGenerationTask,
): FortuneGenerationTaskRecord {
  return {
    ...task,
    fortune_type: task.fortune_type as FortuneGenerationTaskRecord["fortune_type"],
    feature_type: task.feature_type as FortuneGenerationTaskRecord["feature_type"],
    prompt_type: task.prompt_type as FortuneGenerationTaskRecord["prompt_type"],
    provider: task.provider as FortuneGenerationTaskRecord["provider"],
    status: task.status as FortuneGenerationTaskRecord["status"],
    ratio: task.ratio as FortuneGenerationTaskRecord["ratio"],
    resolution: task.resolution as FortuneGenerationTaskRecord["resolution"],
    temp_input_urls: toStringArray(task.temp_input_urls),
    metadata:
      task.metadata && typeof task.metadata === "object" && !Array.isArray(task.metadata)
        ? (task.metadata as Record<string, unknown>)
        : {},
    quota_counted_at: toIsoString(task.quota_counted_at),
    lock_until: toIsoString(task.lock_until),
    created_at: task.created_at.toISOString(),
    submitted_at: toIsoString(task.submitted_at),
    completed_at: toIsoString(task.completed_at),
    deleted_at: toIsoString(task.deleted_at),
  };
}

export function toSystemConfigRecord(config: SystemConfig): SystemConfigRecord {
  return {
    ...config,
    value: config.value,
    updated_at: config.updated_at.toISOString(),
  };
}
