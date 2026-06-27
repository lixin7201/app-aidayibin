import { getImageGenerationTask } from "@/lib/apimart/client";
import type { GenerationTaskRecord } from "@/lib/db/database.types";
import { prisma } from "@/lib/db/prisma";
import { toGenerationTaskRecord } from "@/lib/db/records";
import { persistRemoteResultImage } from "@/lib/storage/image-storage";

type SyncTaskResult = {
  taskId: string;
  status: "pending" | "processing" | "succeeded" | "failed" | "skipped";
  message?: string;
};

export async function syncPendingGenerationTasks(input?: {
  userId?: string;
  batchSize?: number;
}) {
  const tasks = await prisma.generationTask.findMany({
    where: {
      status: { in: ["pending", "processing"] },
      provider_task_id: { not: null },
      deleted_at: null,
      ...(input?.userId ? { user_id: input.userId } : {}),
    },
    orderBy: { created_at: "asc" },
    take: input?.batchSize ?? 20,
  });

  const results = [];

  for (const task of tasks) {
    results.push(await syncGenerationTask(toGenerationTaskRecord(task)));
  }

  return results;
}

export async function syncGenerationTask(task: GenerationTaskRecord) {
  if (!task.provider_task_id) {
    return { taskId: task.id, status: "skipped" } satisfies SyncTaskResult;
  }

  try {
    const providerResult = await getImageGenerationTask(task.provider_task_id);

    if (
      providerResult.status === "pending" ||
      providerResult.status === "processing"
    ) {
      await prisma.generationTask.update({
        where: { id: task.id },
        data: { status: providerResult.status },
      });

      return {
        taskId: task.id,
        status: providerResult.status,
      } satisfies SyncTaskResult;
    }

    if (providerResult.status === "failed") {
      await prisma.generationTask.update({
        where: { id: task.id },
        data: {
          status: "failed",
          error_code: providerResult.errorCode ?? "PROVIDER_FAILED",
          error_message: providerResult.errorMessage ?? "AI 生成失败",
          completed_at: new Date(),
        },
      });

      const { incrementFailedCount } = await import(
        "@/features/quota/quota-service"
      );
      await incrementFailedCount(task.user_id);

      return { taskId: task.id, status: "failed" } satisfies SyncTaskResult;
    }

    if (!providerResult.imageUrl) {
      throw new Error("Provider succeeded without image URL");
    }

    const storedImage = await persistRemoteResultImage({
      imageUrl: providerResult.imageUrl,
      userId: task.user_id,
      taskId: task.id,
    });

    const result = await prisma.generationTask.updateMany({
      where: {
        id: task.id,
        quota_counted_at: null,
      },
      data: {
        status: "succeeded",
        provider_result_url: providerResult.imageUrl,
        stored_image_url: storedImage.originalUrl,
        public_image_url: storedImage.shareUrl ?? storedImage.originalUrl,
        preview_image_url: storedImage.previewUrl,
        share_image_url: storedImage.shareUrl,
        card_image_url: storedImage.cardUrl,
        storage_provider: storedImage.provider,
        storage_object_key: storedImage.originalObjectKey,
        preview_object_key: storedImage.previewObjectKey,
        share_object_key: storedImage.shareObjectKey,
        card_object_key: storedImage.cardObjectKey,
        counts_quota: true,
        quota_counted_at: new Date(),
        completed_at: new Date(),
      },
    });

    if (result.count > 0) {
      const { incrementSuccessCount } = await import(
        "@/features/quota/quota-service"
      );
      await incrementSuccessCount(task.user_id);
    }

    return { taskId: task.id, status: "succeeded" } satisfies SyncTaskResult;
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";

    await prisma.generationTask.update({
      where: { id: task.id },
      data: {
        status: "failed",
        error_code: "WORKER_ERROR",
        error_message: message,
        completed_at: new Date(),
      },
    });

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
