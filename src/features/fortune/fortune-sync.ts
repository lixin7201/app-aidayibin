import { isMissingFortuneTableError } from "@/features/fortune/fortune-db";
import { getImageGenerationTask } from "@/lib/apimart/client";
import type { FortuneGenerationTaskRecord } from "@/lib/db/database.types";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { persistRemoteImage } from "@/lib/storage/r2";

type SyncFortuneTaskResult = {
  taskId: string;
  status: "pending" | "processing" | "succeeded" | "failed" | "skipped";
  message?: string;
};

export async function syncPendingFortuneTasks(input?: {
  userId?: string;
  batchSize?: number;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return [] as SyncFortuneTaskResult[];
  }

  let query = supabase
    .from("fortune_generation_tasks")
    .select("*")
    .in("status", ["pending", "processing"])
    .not("provider_task_id", "is", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(input?.batchSize ?? 20);

  if (input?.userId) {
    query = query.eq("user_id", input.userId);
  }

  const { data: tasks, error } = await query;

  if (error) {
    if (isMissingFortuneTableError(error)) {
      return [] as SyncFortuneTaskResult[];
    }

    throw new Error(error.message);
  }

  const results = [];

  for (const task of tasks ?? []) {
    results.push(await syncFortuneTask(task));
  }

  return results;
}

export async function syncFortuneTask(task: FortuneGenerationTaskRecord) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return { taskId: task.id, status: "skipped" } satisfies SyncFortuneTaskResult;
  }

  if (!task.provider_task_id) {
    return { taskId: task.id, status: "skipped" } satisfies SyncFortuneTaskResult;
  }

  try {
    const providerResult = await getImageGenerationTask(task.provider_task_id);

    if (
      providerResult.status === "pending" ||
      providerResult.status === "processing"
    ) {
      await supabase
        .from("fortune_generation_tasks")
        .update({ status: providerResult.status })
        .eq("id", task.id);

      return {
        taskId: task.id,
        status: providerResult.status,
      } satisfies SyncFortuneTaskResult;
    }

    if (providerResult.status === "failed") {
      await supabase
        .from("fortune_generation_tasks")
        .update({
          status: "failed",
          error_code: providerResult.errorCode ?? "PROVIDER_FAILED",
          error_message: providerResult.errorMessage ?? "AI 生成失败",
          completed_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      return { taskId: task.id, status: "failed" } satisfies SyncFortuneTaskResult;
    }

    if (!providerResult.imageUrl) {
      throw new Error("Provider succeeded without image URL");
    }

    const storedImageUrl = await persistRemoteImage({
      imageUrl: providerResult.imageUrl,
      userId: task.user_id,
      taskId: task.id,
    });

    const { error: updateError } = await supabase
      .from("fortune_generation_tasks")
      .update({
        status: "succeeded",
        provider_result_url: providerResult.imageUrl,
        stored_image_url: storedImageUrl,
        counts_quota: true,
        quota_counted_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq("id", task.id)
      .is("quota_counted_at", null);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { taskId: task.id, status: "succeeded" } satisfies SyncFortuneTaskResult;
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";

    await supabase
      .from("fortune_generation_tasks")
      .update({
        status: "failed",
        error_code: "WORKER_ERROR",
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    return {
      taskId: task.id,
      status: "failed",
      message,
    } satisfies SyncFortuneTaskResult;
  }
}
