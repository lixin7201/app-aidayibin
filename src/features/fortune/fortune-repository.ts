import type { SessionUser } from "@/features/auth/session";
import type { CreateFortuneGenerationInput } from "@/features/fortune/fortune-schemas";
import type { FortuneGenerationTask } from "@/features/fortune/types";
import {
  getFortuneFeatureType,
  getFortuneTypeName,
} from "@/features/fortune/types";
import { syncPendingFortuneTasks } from "@/features/fortune/fortune-sync";
import { signImageToken } from "@/lib/auth/image-token";
import { signResultShareToken } from "@/lib/auth/result-share-token";
import { buildResultSharePageUrl } from "@/lib/share/result-share";
import type { FortuneGenerationTaskRecord } from "@/lib/db/database.types";
import { prisma } from "@/lib/db/prisma";
import { toFortuneGenerationTaskRecord } from "@/lib/db/records";
import { apiPath } from "@/lib/routes";

export type CreateFortuneTaskRecordInput = {
  user: SessionUser;
  input: CreateFortuneGenerationInput;
  submitIp: string;
  userAgent: string;
  provider: "apimart" | "mock";
};

function buildPublicImageUrl(
  taskId: string,
  variant: "share" | "original" | "card" | "thumb",
): string {
  const url = new URL(apiPath(`/fortune/generations/${taskId}/image`), "http://localhost");
  url.searchParams.set("public", "1");
  url.searchParams.set("variant", variant);
  url.searchParams.set("t", signImageToken("fortune", taskId, variant));
  return url.pathname + url.search;
}

function buildPreviewImageUrl(taskId: string): string {
  const url = new URL(apiPath(`/fortune/generations/${taskId}/image`), "http://localhost");
  url.searchParams.set("preview", "1");
  return url.pathname + url.search;
}

function mapFortuneTask(task: FortuneGenerationTaskRecord): FortuneGenerationTask {
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
    type: task.fortune_type,
    featureType: task.feature_type,
    typeName: getFortuneTypeName(task.fortune_type),
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
            "fortune",
            task.id,
            signResultShareToken("fortune", task.id),
          )
        : null,
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
  const taskId = crypto.randomUUID();
  const featureType = getFortuneFeatureType(input.type);
  const promptType = input.type === "palm" ? "palm_report" : "face_report";

  const data = await prisma.fortuneGenerationTask.create({
    data: {
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
    },
  });

  return toFortuneGenerationTaskRecord(data);
}

export async function updateFortuneProviderTask(
  taskId: string,
  providerTaskId: string,
) {
  await prisma.fortuneGenerationTask.update({
    where: { id: taskId },
    data: {
      provider_task_id: providerTaskId,
      status: "processing",
      submitted_at: new Date(),
    },
  });
}

export async function markFortuneFailed(
  taskId: string,
  errorCode: string,
  errorMessage: string,
) {
  await prisma.fortuneGenerationTask.update({
    where: { id: taskId },
    data: {
      status: "failed",
      error_code: errorCode,
      error_message: errorMessage,
      completed_at: new Date(),
    },
  });
}

export async function listUserFortuneGenerations(userId: string) {
  await syncPendingFortuneTasks({ userId });

  const data = await prisma.fortuneGenerationTask.findMany({
    where: {
      user_id: userId,
      deleted_at: null,
    },
    orderBy: { created_at: "desc" },
  });

  return data.map((task) => mapFortuneTask(toFortuneGenerationTaskRecord(task)));
}

export async function getUserFortuneGenerationById(
  userId: string,
  taskId: string,
) {
  await syncPendingFortuneTasks({ userId, batchSize: 5 });

  const data = await prisma.fortuneGenerationTask.findFirst({
    where: {
      id: taskId,
      user_id: userId,
      deleted_at: null,
    },
  });

  if (!data) {
    return null;
  }

  return mapFortuneTask(toFortuneGenerationTaskRecord(data));
}

export async function getPublicFortuneGenerationById(taskId: string) {
  const data = await prisma.fortuneGenerationTask.findFirst({
    where: {
      id: taskId,
      deleted_at: null,
    },
  });

  if (!data) {
    return null;
  }

  return mapFortuneTask(toFortuneGenerationTaskRecord(data));
}

export async function softDeleteUserFortuneGeneration(
  userId: string,
  taskId: string,
) {
  const result = await prisma.fortuneGenerationTask.updateMany({
    where: { id: taskId, user_id: userId },
    data: { deleted_at: new Date() },
  });

  return result.count > 0;
}
