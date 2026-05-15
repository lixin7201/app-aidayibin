import { listTemplates } from "@/features/templates/template-repository";
import { getFortuneSystemLimits } from "@/features/fortune/fortune-quota-service";
import { getBeijingDate, getSystemLimits } from "@/features/quota/quota-service";
import type {
  FortuneGenerationTaskRecord,
  GenerationTaskRecord,
  PhotoTemplateRecord,
} from "@/lib/db/database.types";
import { getSupabaseAdmin } from "@/lib/db/supabase";

export async function getAdminDashboard() {
  const supabase = getSupabaseAdmin();
  const templates = await listTemplates({ includeInactive: true });
  const limits = await getSystemLimits();
  const fortuneLimits = await getFortuneSystemLimits();

  if (!supabase) {
    return {
      metrics: {
        todaySubmitted: 0,
        todaySucceeded: 0,
        todayFailed: 0,
        fortuneTodaySubmitted: 0,
        fortuneTodaySucceeded: 0,
        fortunePalmSubmitted: 0,
        fortuneFaceSubmitted: 0,
        activeUsers: 0,
        successRate: 0,
      },
      limits,
      fortuneLimits,
      topTemplates: templates.slice(0, 5).map((template) => ({
        name: template.name,
        count: 0,
      })),
    };
  }

  const today = getBeijingDate();
  const start = `${today}T00:00:00+08:00`;
  const [
    submitted,
    succeeded,
    failed,
    fortuneSubmitted,
    fortuneSucceeded,
    fortunePalmSubmitted,
    fortuneFaceSubmitted,
    activeUsers,
    topTemplatesResult,
  ] = await Promise.all([
    supabase
      .from("generation_tasks")
      .select("id", { count: "exact", head: true })
      .gte("created_at", start),
    supabase
      .from("generation_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "succeeded")
      .gte("created_at", start),
    supabase
      .from("generation_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", start),
    supabase
      .from("fortune_generation_tasks")
      .select("id", { count: "exact", head: true })
      .gte("created_at", start),
    supabase
      .from("fortune_generation_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "succeeded")
      .gte("created_at", start),
    supabase
      .from("fortune_generation_tasks")
      .select("id", { count: "exact", head: true })
      .eq("fortune_type", "palm")
      .gte("created_at", start),
    supabase
      .from("fortune_generation_tasks")
      .select("id", { count: "exact", head: true })
      .eq("fortune_type", "face")
      .gte("created_at", start),
    supabase
      .from("generation_tasks")
      .select("user_id")
      .gte("created_at", start),
    supabase
      .from("generation_tasks")
      .select("template_id, photo_templates:template_id(name)")
      .eq("status", "succeeded")
      .gte("created_at", start),
  ]);

  const activeUserCount = new Set(
    activeUsers.data?.map((item) => item.user_id) ?? [],
  ).size;
  const topTemplateMap = new Map<string, { name: string; count: number }>();

  for (const task of topTemplatesResult.data ?? []) {
    const typedTask = task as {
      template_id: string;
      photo_templates?: Pick<PhotoTemplateRecord, "name"> | null;
    };
    const current = topTemplateMap.get(typedTask.template_id);
    topTemplateMap.set(typedTask.template_id, {
      name: typedTask.photo_templates?.name ?? "未知模板",
      count: (current?.count ?? 0) + 1,
    });
  }

  const todaySubmitted = submitted.count ?? 0;
  const todaySucceeded = succeeded.count ?? 0;

  return {
    metrics: {
        todaySubmitted,
        todaySucceeded,
        todayFailed: failed.count ?? 0,
        fortuneTodaySubmitted: fortuneSubmitted.count ?? 0,
        fortuneTodaySucceeded: fortuneSucceeded.count ?? 0,
        fortunePalmSubmitted: fortunePalmSubmitted.count ?? 0,
        fortuneFaceSubmitted: fortuneFaceSubmitted.count ?? 0,
        activeUsers: activeUserCount,
        successRate:
          todaySubmitted > 0
          ? Math.round((todaySucceeded / todaySubmitted) * 100)
          : 0,
    },
    limits,
    fortuneLimits,
    topTemplates: Array.from(topTemplateMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  };
}

export async function listAdminGenerations() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return [] as GenerationTaskRecord[];
  }

  const { data } = await supabase
    .from("generation_tasks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return data ?? [];
}

export async function listAdminFortuneGenerations() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return [] as FortuneGenerationTaskRecord[];
  }

  const { data } = await supabase
    .from("fortune_generation_tasks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return data ?? [];
}
