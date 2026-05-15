import { getImageGenerationTask } from "@/lib/apimart/client";
import type { GenerationTaskRecord } from "@/lib/db/database.types";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { persistRemoteImage } from "@/lib/storage/r2";

type SyncTaskResult = {
  taskId: string;
  status: "pending" | "processing" | "succeeded" | "failed" | "skipped";
  message?: string;
};

export async function syncPendingGenerationTasks(input?: {
  userId?: string;
  batchSize?: number;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return [] as SyncTaskResult[];
  }

  let query = supabase
    .from("generation_tasks")
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
    throw new Error(error.message);
  }

  const results = [];

  for (const task of tasks ?? []) {
    results.push(await syncGenerationTask(task));
  }

  return results;
}

export async function syncGenerationTask(task: GenerationTaskRecord) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return { taskId: task.id, status: "skipped" } satisfies SyncTaskResult;
  }

  if (!task.provider_task_id) {
    return { taskId: task.id, status: "skipped" } satisfies SyncTaskResult;
  }

  try {
    const providerResult = await getImageGenerationTask(task.provider_task_id);

    if (
      providerResult.status === "pending" ||
      providerResult.status === "processing"
    ) {
      await supabase
        .from("generation_tasks")
        .update({ status: providerResult.status })
        .eq("id", task.id);

      return {
        taskId: task.id,
        status: providerResult.status,
      } satisfies SyncTaskResult;
    }

    if (providerResult.status === "failed") {
      await supabase
        .from("generation_tasks")
        .update({
          status: "failed",
          error_code: providerResult.errorCode ?? "PROVIDER_FAILED",
          error_message: providerResult.errorMessage ?? "AI 生成失败",
          completed_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      const { incrementFailedCount } = await import(
        "@/features/quota/quota-service"
      );
      await incrementFailedCount(task.user_id);

      return { taskId: task.id, status: "failed" } satisfies SyncTaskResult;
    }

    if (!providerResult.imageUrl) {
      throw new Error("Provider succeeded without image URL");
    }

    const storedImageUrl = await persistRemoteImage({
      imageUrl: providerResult.imageUrl,
      userId: task.user_id,
      taskId: task.id,
    });

    const { data: updatedTask, error: updateError } = await supabase
      .from("generation_tasks")
      .update({
        status: "succeeded",
        provider_result_url: providerResult.imageUrl,
        stored_image_url: storedImageUrl,
        counts_quota: true,
        quota_counted_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq("id", task.id)
      .is("quota_counted_at", null)
      .select("id")
      .maybeSingle();

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (updatedTask) {
      const { incrementSuccessCount } = await import(
        "@/features/quota/quota-service"
      );
      await incrementSuccessCount(task.user_id);
    }

    return { taskId: task.id, status: "succeeded" } satisfies SyncTaskResult;
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";

    await supabase
      .from("generation_tasks")
      .update({
        status: "failed",
        error_code: "WORKER_ERROR",
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    const { incrementFailedCount } = await import(
      "@/features/quota/quota-service"
    );
    await incrementFailedCount(task.user_id);

    return {
      taskId: task.id,
      status: "failed",
      message,
    } satisfies SyncTaskResult;
  }
}
