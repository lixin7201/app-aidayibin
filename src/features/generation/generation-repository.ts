import type { SessionUser } from "@/features/auth/session";
import type { CreateGenerationInput } from "@/features/generation/generation-schemas";
import type { GenerationTask } from "@/features/generation/types";
import { syncPendingGenerationTasks } from "@/features/generation/generation-sync";
import { signImageToken } from "@/lib/auth/image-token";
import { signResultShareToken } from "@/lib/auth/result-share-token";
import { buildResultSharePageUrl } from "@/lib/share/result-share";
import type {
  GenerationTaskRecord,
  PhotoTemplateRecord,
} from "@/lib/db/database.types";
import { prisma } from "@/lib/db/prisma";
import { toGenerationTaskRecord } from "@/lib/db/records";
import { apiPath } from "@/lib/routes";
import { deleteTaskImages } from "@/lib/storage/image-storage";

export type CreateTaskRecordInput = {
  user: SessionUser;
  input: CreateGenerationInput;
  submitIp: string;
  userAgent: string;
  provider: "apimart" | "mock";
};

function buildPublicImageUrl(
  taskId: string,
  variant: "share" | "original" | "card" | "thumb",
): string {
  const url = new URL(apiPath(`/generations/${taskId}/image`), "http://localhost");
  url.searchParams.set("public", "1");
  url.searchParams.set("variant", variant);
  url.searchParams.set("t", signImageToken("photo", taskId, variant));
  return url.pathname + url.search;
}

function buildPreviewImageUrl(taskId: string): string {
  const url = new URL(apiPath(`/generations/${taskId}/image`), "http://localhost");
  url.searchParams.set("preview", "1");
  return url.pathname + url.search;
}

function mapGenerationTask(
  task: GenerationTaskRecord & {
    photo_templates?: Pick<PhotoTemplateRecord, "name"> | null;
  },
): GenerationTask {
  const hasResultImage = task.status === "succeeded" && Boolean(task.stored_image_url);
  const previewImageUrl = hasResultImage
    ? task.preview_image_url ?? buildPreviewImageUrl(task.id)
    : null;
  const shareImageUrl = hasResultImage
    ? task.share_image_url ??
      task.public_image_url ??
      buildPublicImageUrl(task.id, "share")
    : null;
  const cardImageUrl = hasResultImage
    ? task.card_image_url ?? buildPublicImageUrl(task.id, "card")
    : null;
  const thumbImageUrl = hasResultImage
    ? buildPublicImageUrl(task.id, "thumb")
    : null;
  const originalImageUrl = hasResultImage
    ? task.stored_image_url ?? buildPublicImageUrl(task.id, "original")
    : null;

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
    previewImageUrl,
    shareImageUrl,
    thumbImageUrl,
    publicImageUrl: shareImageUrl,
    cardImageUrl,
    originalImageUrl,
    sharePageUrl:
      hasResultImage
        ? buildResultSharePageUrl(
            "photo",
            task.id,
            signResultShareToken("photo", task.id),
          )
        : null,
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
  const taskId = crypto.randomUUID();

  const data = await prisma.generationTask.create({
    data: {
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
    },
  });

  return toGenerationTaskRecord(data);
}

export async function updateGenerationProviderTask(
  taskId: string,
  providerTaskId: string,
) {
  await prisma.generationTask.update({
    where: { id: taskId },
    data: {
      provider_task_id: providerTaskId,
      status: "processing",
      submitted_at: new Date(),
    },
  });
}

export async function markGenerationFailed(
  taskId: string,
  errorCode: string,
  errorMessage: string,
) {
  await prisma.generationTask.update({
    where: { id: taskId },
    data: {
      status: "failed",
      error_code: errorCode,
      error_message: errorMessage,
      completed_at: new Date(),
    },
  });
}

export async function listUserGenerations(userId: string) {
  await syncPendingGenerationTasks({ userId });

  const data = await prisma.generationTask.findMany({
    where: {
      user_id: userId,
      deleted_at: null,
    },
    include: {
      photo_templates: {
        select: { name: true },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return data.map((task) =>
    mapGenerationTask(
      {
        ...toGenerationTaskRecord(task),
        photo_templates: task.photo_templates,
      } as GenerationTaskRecord & {
        photo_templates?: Pick<PhotoTemplateRecord, "name"> | null;
      },
    ),
  );
}

export async function getUserGenerationById(userId: string, taskId: string) {
  await syncPendingGenerationTasks({ userId, batchSize: 5 });

  const data = await prisma.generationTask.findFirst({
    where: {
      id: taskId,
      user_id: userId,
      deleted_at: null,
    },
    include: {
      photo_templates: {
        select: { name: true },
      },
    },
  });

  if (!data) {
    return null;
  }

  return mapGenerationTask(
    {
      ...toGenerationTaskRecord(data),
      photo_templates: data.photo_templates,
    } as GenerationTaskRecord & {
      photo_templates?: Pick<PhotoTemplateRecord, "name"> | null;
    },
  );
}

export async function getPublicGenerationById(taskId: string) {
  const data = await prisma.generationTask.findFirst({
    where: {
      id: taskId,
      deleted_at: null,
    },
    include: {
      photo_templates: {
        select: { name: true },
      },
    },
  });

  if (!data) {
    return null;
  }

  return mapGenerationTask(
    {
      ...toGenerationTaskRecord(data),
      photo_templates: data.photo_templates,
    } as GenerationTaskRecord & {
      photo_templates?: Pick<PhotoTemplateRecord, "name"> | null;
    },
  );
}

export async function softDeleteUserGeneration(userId: string, taskId: string) {
  const task = await prisma.generationTask.findFirst({
    where: { id: taskId, user_id: userId },
    select: {
      id: true,
      user_id: true,
      storage_provider: true,
      storage_object_key: true,
      preview_object_key: true,
      share_object_key: true,
      card_object_key: true,
      temp_input_urls: true,
    },
  });

  if (!task) {
    return false;
  }

  const result = await prisma.generationTask.updateMany({
    where: { id: taskId, user_id: userId },
    data: { deleted_at: new Date() },
  });

  if (result.count > 0) {
    await deleteTaskImages({
      provider: task.storage_provider,
      userId: task.user_id,
      taskId: task.id,
      originalObjectKey: task.storage_object_key,
      previewObjectKey: task.preview_object_key,
      shareObjectKey: task.share_object_key,
      cardObjectKey: task.card_object_key,
      tempInputUrls: task.temp_input_urls,
    });
  }

  return result.count > 0;
}
