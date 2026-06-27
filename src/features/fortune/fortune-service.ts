import type { SessionUser } from "@/features/auth/session";
import type { CreateFortuneGenerationInput } from "@/features/fortune/fortune-schemas";
import {
  markFortuneFailed,
  updateFortuneProviderTask,
} from "@/features/fortune/fortune-repository";
import {
  buildFortunePrompt,
  fortuneNegativePrompt,
} from "@/features/fortune/fortune-prompts";
import {
  assertCanCreateFortuneGeneration,
} from "@/features/fortune/fortune-quota-service";
import { syncPendingFortuneTasks } from "@/features/fortune/fortune-sync";
import { createImageGenerationTask } from "@/lib/apimart/client";
import { config, isMockEnabled } from "@/lib/config";
import {
  acquireMysqlAdvisoryLock,
  releaseMysqlAdvisoryLock,
} from "@/lib/db/mysql-lock";
import { prisma } from "@/lib/db/prisma";
import { toFortuneGenerationTaskRecord } from "@/lib/db/records";
import { AppError, errorCodes } from "@/lib/http/errors";

export async function submitFortuneGeneration(input: {
  user: SessionUser;
  payload: CreateFortuneGenerationInput;
  submitIp: string;
  userAgent: string;
}) {
  if (input.payload.ratio !== "3:4") {
    throw new AppError(errorCodes.INVALID_IMAGE_FORMAT, "AI 算命仅支持 3:4 输出");
  }

  if (input.payload.resolution !== "2k") {
    throw new AppError(errorCodes.INVALID_IMAGE_FORMAT, "AI 算命仅支持 2K 输出");
  }

  // 同步任务状态（涉及外部 API，放在锁外）
  await syncPendingFortuneTasks({ userId: input.user.id });

  // 额度预检（快速失败）
  await assertCanCreateFortuneGeneration(input.user, input.payload.type);

  const shouldUseMockProvider = isMockEnabled && !config.APIMART_API_KEY;
  const provider = shouldUseMockProvider ? "mock" : "apimart";

  // 在事务中获取 MySQL 顾问锁，保证同一用户并发提交的原子性
  const task = await prisma.$transaction(async (tx) => {
    const lockKey = `ai_quota:${input.user.id}:fortune_${input.payload.type}`;
    const lockAcquired = await acquireMysqlAdvisoryLock(tx, lockKey, 5);

    if (!lockAcquired) {
      throw new AppError(
        errorCodes.RUNNING_TASK_EXISTS,
        "系统繁忙，请稍后再试",
      );
    }

    try {
      // 在锁保护下再次检查 running task（防止并发窗口）
      const runningCount = await tx.fortuneGenerationTask.count({
        where: {
          user_id: input.user.id,
          status: { in: ["pending", "processing"] },
          deleted_at: null,
        },
      });

      if (runningCount > 0) {
        throw new AppError(
          errorCodes.RUNNING_TASK_EXISTS,
          "你已有一张报告正在生成，请稍后查看",
        );
      }

      // 创建任务记录
      const taskId = crypto.randomUUID();
      const featureType = input.payload.type === "palm" ? "fortune_palm" : "fortune_face";
      const promptType = input.payload.type === "palm" ? "palm_report" : "face_report";
      const data = await tx.fortuneGenerationTask.create({
        data: {
          id: taskId,
          user_id: input.user.id,
          fortune_type: input.payload.type,
          feature_type: featureType,
          prompt_type: promptType,
          provider,
          status: "pending",
          ratio: input.payload.ratio,
          resolution: input.payload.resolution,
          input_image_count: input.payload.image_urls.length,
          temp_input_urls: input.payload.image_urls,
          submit_ip: input.submitIp,
          device_id: input.user.deviceId,
          user_agent: input.userAgent,
          metadata: {
            ratio: input.payload.ratio,
            resolution: input.payload.resolution,
          },
        },
      });

      return toFortuneGenerationTaskRecord(data);
    } finally {
      await releaseMysqlAdvisoryLock(tx, lockKey);
    }
  });

  try {
    const providerTask = await createImageGenerationTask({
      prompt: buildFortunePrompt(input.payload.type),
      negativePrompt: fortuneNegativePrompt,
      imageUrls: input.payload.image_urls,
      ratio: input.payload.ratio,
      resolution: input.payload.resolution,
    });

    await updateFortuneProviderTask(task.id, providerTask.providerTaskId);
  } catch (error) {
    await markFortuneFailed(
      task.id,
      "PROVIDER_SUBMIT_FAILED",
      error instanceof Error ? error.message : "AI 服务提交失败",
    );
    throw error;
  }

  return {
    taskId: task.id,
    status: "pending",
  };
}
