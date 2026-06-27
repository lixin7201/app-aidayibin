import { defaultTemplates } from "@/features/templates/default-templates";
import type { PhotoTemplate } from "@/features/templates/types";
import type { PhotoTemplateRecord } from "@/lib/db/database.types";
import { defaultSystemConfigs } from "@/lib/db/default-system-configs";
import { prisma } from "@/lib/db/prisma";
import { toPhotoTemplateRecord } from "@/lib/db/records";

function mapTemplateRecord(record: PhotoTemplateRecord): PhotoTemplate {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    category: record.category,
    coverUrl: record.cover_url,
    animatedCoverUrl: record.animated_cover_url ?? undefined,
    tagline: record.tagline,
    description: record.description,
    prompt: record.prompt,
    negativePrompt: record.negative_prompt,
    recommendedRatios: record.recommended_ratios,
    supportedRatios: record.supported_ratios,
    genderOptions: record.gender_options,
    ageOptions: record.age_options,
    sortOrder: record.sort_order,
    isActive: record.is_active,
  };
}

function mapTemplateToRecord(template: PhotoTemplate) {
  return {
    id: template.id,
    name: template.name,
    slug: template.slug,
    category: template.category,
    cover_url: template.coverUrl,
    animated_cover_url: template.animatedCoverUrl ?? null,
    tagline: template.tagline,
    description: template.description,
    prompt: template.prompt,
    negative_prompt: template.negativePrompt,
    recommended_ratios: template.recommendedRatios,
    supported_ratios: template.supportedRatios,
    gender_options: template.genderOptions,
    age_options: template.ageOptions,
    sort_order: template.sortOrder,
    is_active: template.isActive,
  };
}

export async function listTemplates({ includeInactive = false } = {}) {
  const data = await prisma.photoTemplate.findMany({
    where: includeInactive ? undefined : { is_active: true },
    orderBy: { sort_order: "asc" },
  });

  if (data.length === 0) {
    return defaultTemplates.filter(
      (template) => includeInactive || template.isActive,
    );
  }

  return data.map((record) => mapTemplateRecord(toPhotoTemplateRecord(record)));
}

export async function getTemplateById(templateId: string) {
  const templates = await listTemplates({ includeInactive: true });
  return templates.find((template) => template.id === templateId) ?? null;
}

export async function seedDefaultTemplates() {
  await Promise.all([
    ...defaultSystemConfigs.map((item) =>
      prisma.systemConfig.upsert({
        where: { key: item.key },
        create: item,
        update: {
          value: item.value,
          description: item.description,
        },
      }),
    ),
    ...defaultTemplates.map((template) => {
      const record = mapTemplateToRecord(template);
      return prisma.photoTemplate.upsert({
        where: { id: record.id },
        create: record,
        update: record,
      });
    }),
  ]);

  return { seeded: defaultTemplates.length, skipped: false };
}
