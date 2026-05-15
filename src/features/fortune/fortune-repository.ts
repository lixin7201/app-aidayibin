import type { SessionUser } from "@/features/auth/session";
import { isMissingFortuneTableError } from "@/features/fortune/fortune-db";
import type { CreateFortuneGenerationInput } from "@/features/fortune/fortune-schemas";
import type { FortuneGenerationTask } from "@/features/fortune/types";
import {
  getFortuneFeatureType,
  getFortuneTypeName,
} from "@/features/fortune/types";
import { syncPendingFortuneTasks } from "@/features/fortune/fortune-sync";
import type { FortuneGenerationTaskRecord } from "@/lib/db/database.types";
import { getSupabaseAdmin } from "@/lib/db/supabase";

export type CreateFortuneTaskRecordInput = {
  user: SessionUser;
  input: CreateFortuneGenerationInput;
  submitIp: string;
  userAgent: string;
  provider: "apimart" | "mock";
};

function mapFortuneTask(task: FortuneGenerationTaskRecord): FortuneGenerationTask {
  return {
    id: task.id,
    userId: task.user_id,
    type: task.fortune_type,
    featureType: task.feature_type,
    typeName: getFortuneTypeName(task.fortune_type),
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

export async function createFortuneRecord({
  user,
  input,
  submitIp,
  userAgent,
  provider,
}: CreateFortuneTaskRecordInput) {
  const supabase = getSupabaseAdmin();
  const taskId = crypto.randomUUID();
  const featureType = getFortuneFeatureType(input.type);
  const promptType = input.type === "palm" ? "palm_report" : "face_report";

  if (!supabase) {
    return {
      id: taskId,
      user_id: user.id,
      fortune_type: input.type,
      feature_type: featureType,
      prompt_type: promptType,
      provider,
      provider_task_id: null,
      status: "pending",
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
      metadata: {},
      lock_until: null,
      created_at: new Date().toISOString(),
      submitted_at: null,
      completed_at: null,
      deleted_at: null,
    } satisfies FortuneGenerationTaskRecord;
  }

  const { data, error } = await supabase
    .from("fortune_generation_tasks")
    .insert({
      id: taskId,
      user_id: user.id,
      fortune_type: input.type,
      feature_type: featureType,
      prompt_type: promptType,
      provider,
      status: "pending",
      ratio: input.ratio,
      resolution: input.resolution,
      input_image_count: input.image_urls.length,
      temp_input_urls: input.image_urls,
      submit_ip: submitIp,
      device_id: user.deviceId,
      user_agent: userAgent,
      metadata: {
        ratio: input.ratio,
        resolution: input.resolution,
      },
    })
    .select("*")
    .single<FortuneGenerationTaskRecord>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateFortuneProviderTask(
  taskId: string,
  providerTaskId: string,
) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return;
  }

  await supabase
    .from("fortune_generation_tasks")
    .update({
      provider_task_id: providerTaskId,
      status: "processing",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", taskId);
}

export async function markFortuneFailed(
  taskId: string,
  errorCode: string,
  errorMessage: string,
) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return;
  }

  await supabase
    .from("fortune_generation_tasks")
    .update({
      status: "failed",
      error_code: errorCode,
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId);
}

export async function listUserFortuneGenerations(userId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return [] satisfies FortuneGenerationTask[];
  }

  await syncPendingFortuneTasks({ userId });

  const { data, error } = await supabase
    .from("fortune_generation_tasks")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (isMissingFortuneTableError(error)) {
    return [];
  }

  if (error || !data) {
    return [];
  }

  return data.map((task) => mapFortuneTask(task));
}

export async function getUserFortuneGenerationById(
  userId: string,
  taskId: string,
) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return null;
  }

  await syncPendingFortuneTasks({ userId, batchSize: 5 });

  const { data, error } = await supabase
    .from("fortune_generation_tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle<FortuneGenerationTaskRecord>();

  if (isMissingFortuneTableError(error)) {
    return null;
  }

  if (error || !data) {
    return null;
  }

  return mapFortuneTask(data);
}

export async function softDeleteUserFortuneGeneration(
  userId: string,
  taskId: string,
) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return true;
  }

  const { error } = await supabase
    .from("fortune_generation_tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("user_id", userId);

  return !error;
}
