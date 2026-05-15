import { defaultTemplates } from "@/features/templates/default-templates";
import type { PhotoTemplate } from "@/features/templates/types";
import type { PhotoTemplateRecord } from "@/lib/db/database.types";
import { getSupabaseAdmin } from "@/lib/db/supabase";

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
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return defaultTemplates.filter(
      (template) => includeInactive || template.isActive,
    );
  }

  let query = supabase
    .from("photo_templates")
    .select("*")
    .order("sort_order", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return defaultTemplates.filter(
      (template) => includeInactive || template.isActive,
    );
  }

  return data.map((record) => mapTemplateRecord(record));
}

export async function getTemplateById(templateId: string) {
  const templates = await listTemplates({ includeInactive: true });
  return templates.find((template) => template.id === templateId) ?? null;
}

export async function seedDefaultTemplates() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return { seeded: 0, skipped: true };
  }

  const { error } = await supabase
    .from("photo_templates")
    .upsert(defaultTemplates.map(mapTemplateToRecord), { onConflict: "id" });

  if (error) {
    throw new Error(error.message);
  }

  return { seeded: defaultTemplates.length, skipped: false };
}
