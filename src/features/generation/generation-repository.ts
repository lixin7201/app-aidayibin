import type { SessionUser } from "@/features/auth/session";
import type { CreateGenerationInput } from "@/features/generation/generation-schemas";
import type { GenerationTask } from "@/features/generation/types";
import { syncPendingGenerationTasks } from "@/features/generation/generation-sync";
import type {
  GenerationTaskRecord,
  PhotoTemplateRecord,
} from "@/lib/db/database.types";
import { getSupabaseAdmin } from "@/lib/db/supabase";

export type CreateTaskRecordInput = {
  user: SessionUser;
  input: CreateGenerationInput;
  submitIp: string;
  userAgent: string;
  provider: "apimart" | "mock";
};

function mapGenerationTask(
  task: GenerationTaskRecord & {
    photo_templates?: Pick<PhotoTemplateRecord, "name"> | null;
  },
): GenerationTask {
  return {
    id: task.id,
    userId: task.user_id,
    templateId: task.template_id,
    templateName: task.photo_templates?.name ?? "AI 写真",
    status: task.status,
    ratio: task.ratio,
    resolution: task.resolution,
    inputImageCount: task.input_image_count,
    storedImageUrl: task.stored_image_url,
    errorMessage: task.error_message,
    createdAt: task.created_at,
    completedAt: task.completed_at,
  };
}

export async function createGenerationRecord({
  user,
  input,
  submitIp,
  userAgent,
  provider,
}: CreateTaskRecordInput) {
  const supabase = getSupabaseAdmin();
  const taskId = crypto.randomUUID();

  if (!supabase) {
    return {
      id: taskId,
      user_id: user.id,
      template_id: input.template_id,
      provider,
      provider_task_id: null,
      status: "pending",
      gender: input.gender,
      age_range: input.age_range,
      ratio: input.ratio,
      resolution: input.resolution,
      input_image_count: input.image_urls.length,
      temp_input_urls: input.image_urls,
      provider_result_url: null,
      stored_image_url: null,
      error_code: null,
      error_message: null,
      submit_ip: submitIp,
      device_id: user.deviceId,
      user_agent: userAgent,
      counts_quota: false,
      quota_counted_at: null,
      lock_until: null,
      created_at: new Date().toISOString(),
      submitted_at: null,
      completed_at: null,
      deleted_at: null,
    } satisfies GenerationTaskRecord;
  }

  const { data, error } = await supabase
    .from("generation_tasks")
    .insert({
      id: taskId,
      user_id: user.id,
      template_id: input.template_id,
      provider,
      status: "pending",
      gender: input.gender,
      age_range: input.age_range,
      ratio: input.ratio,
      resolution: input.resolution,
      input_image_count: input.image_urls.length,
      temp_input_urls: input.image_urls,
      submit_ip: submitIp,
      device_id: user.deviceId,
      user_agent: userAgent,
    })
    .select("*")
    .single<GenerationTaskRecord>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateGenerationProviderTask(
  taskId: string,
  providerTaskId: string,
) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return;
  }

  await supabase
    .from("generation_tasks")
    .update({
      provider_task_id: providerTaskId,
      status: "processing",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", taskId);
}

export async function markGenerationFailed(
  taskId: string,
  errorCode: string,
  errorMessage: string,
) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return;
  }

  await supabase
    .from("generation_tasks")
    .update({
      status: "failed",
      error_code: errorCode,
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId);
}

export async function listUserGenerations(userId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return [] satisfies GenerationTask[];
  }

  await syncPendingGenerationTasks({ userId });

  const { data, error } = await supabase
    .from("generation_tasks")
    .select(
      "*, photo_templates:template_id(name)",
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((task) =>
    mapGenerationTask(
      task as GenerationTaskRecord & {
        photo_templates?: Pick<PhotoTemplateRecord, "name"> | null;
      },
    ),
  );
}

export async function getUserGenerationById(userId: string, taskId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return null;
  }

  await syncPendingGenerationTasks({ userId, batchSize: 5 });

  const { data, error } = await supabase
    .from("generation_tasks")
    .select("*, photo_templates:template_id(name)")
    .eq("id", taskId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapGenerationTask(
    data as GenerationTaskRecord & {
      photo_templates?: Pick<PhotoTemplateRecord, "name"> | null;
    },
  );
}

export async function softDeleteUserGeneration(userId: string, taskId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return true;
  }

  const { error } = await supabase
    .from("generation_tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("user_id", userId);

  return !error;
}
