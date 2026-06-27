import type { SessionUser } from "@/features/auth/session";
import type { CreateGenerationInput } from "@/features/generation/generation-schemas";
import {
  markGenerationFailed,
  updateGenerationProviderTask,
} from "@/features/generation/generation-repository";
import { syncPendingGenerationTasks } from "@/features/generation/generation-sync";
import { getTemplateById } from "@/features/templates/template-repository";
import {
  assertCanCreateGeneration,
  getBeijingDate,
} from "@/features/quota/quota-service";
import { createImageGenerationTask } from "@/lib/apimart/client";
import { config, isMockEnabled } from "@/lib/config";
import {
  acquireMysqlAdvisoryLock,
  releaseMysqlAdvisoryLock,
} from "@/lib/db/mysql-lock";
import { prisma } from "@/lib/db/prisma";
import { toGenerationTaskRecord } from "@/lib/db/records";
import { AppError, errorCodes } from "@/lib/http/errors";

export async function submitGeneration(input: {
  user: SessionUser;
  payload: CreateGenerationInput;
  submitIp: string;
  userAgent: string;
}) {
  const template = await getTemplateById(input.payload.template_id);

  if (!template) {
    throw new AppError(errorCodes.TEMPLATE_NOT_FOUND, "模板不存在", 404);
  }

  if (!template.isActive) {
    throw new AppError(errorCodes.TEMPLATE_DISABLED, "模板已下线");
  }

  if (!template.supportedRatios.includes(input.payload.ratio)) {
    throw new AppError(errorCodes.TEMPLATE_DISABLED, "该模板不支持所选比例");
  }

  // 同步任务状态（涉及外部 API，放在锁外）
  await syncPendingGenerationTasks({ userId: input.user.id });

  // 额度预检（快速失败）
  await assertCanCreateGeneration(input.user);

  const shouldUseMockProvider = isMockEnabled && !config.APIMART_API_KEY;
  const provider = shouldUseMockProvider ? "mock" : "apimart";

  // 在事务中获取 MySQL 顾问锁，保证同一用户并发提交的原子性
  const task = await prisma.$transaction(async (tx) => {
    const lockKey = `ai_quota:${input.user.id}:photo`;
    const lockAcquired = await acquireMysqlAdvisoryLock(tx, lockKey, 5);

    if (!lockAcquired) {
      throw new AppError(
        errorCodes.RUNNING_TASK_EXISTS,
        "系统繁忙，请稍后再试",
      );
    }

    try {
      // 在锁保护下再次检查 running task（防止并发窗口）
      const runningCount = await tx.generationTask.count({
        where: {
          user_id: input.user.id,
          status: { in: ["pending", "processing"] },
          deleted_at: null,
        },
      });

      if (runningCount > 0) {
        throw new AppError(
          errorCodes.RUNNING_TASK_EXISTS,
          "你已有一张图片正在生成，请稍后查看",
        );
      }

      // 创建任务记录
      const taskId = crypto.randomUUID();
      const data = await tx.generationTask.create({
        data: {
          id: taskId,
          user_id: input.user.id,
          template_id: input.payload.template_id,
          provider,
          status: "pending",
          gender: input.payload.gender,
          age_range: input.payload.age_range,
          ratio: input.payload.ratio,
          resolution: input.payload.resolution,
          input_image_count: input.payload.image_urls.length,
          temp_input_urls: input.payload.image_urls,
          submit_ip: input.submitIp,
          device_id: input.user.deviceId,
          user_agent: input.userAgent,
        },
      });

      // 更新提交计数
      if (!isMockEnabled) {
        const usageDate = getBeijingDate();
        await tx.dailyUsage.upsert({
          where: {
            user_id_usage_date: {
              user_id: input.user.id,
              usage_date: usageDate,
            },
          },
          create: {
            user_id: input.user.id,
            usage_date: usageDate,
            submit_count: 1,
          },
          update: {
            submit_count: { increment: 1 },
          },
        });
      }

      return toGenerationTaskRecord(data);
    } finally {
      await releaseMysqlAdvisoryLock(tx, lockKey);
    }
  });

  try {
    const providerTask = await createImageGenerationTask({
      prompt: buildPrompt(template.prompt, input.payload.gender),
      negativePrompt: template.negativePrompt,
      imageUrls: input.payload.image_urls,
      ratio: input.payload.ratio,
      resolution: input.payload.resolution,
    });

    await updateGenerationProviderTask(task.id, providerTask.providerTaskId);
  } catch (error) {
    await markGenerationFailed(
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

function buildPrompt(prompt: string, gender: string) {
  return `${prompt} Subject profile: gender preference ${gender}. Keep the final image realistic. Use the uploaded images as identity references for the same real person, not as literal head cutouts and not as loose inspiration for a new face. Identity is the first priority: preserve the person's recognizable face shape, facial proportions, eyes, eyebrows, nose, mouth, jawline, skin undertone, and distinctive facial features across the template. Generate one integrated photographed person: face, hair, neck, shoulders, body, outfit, lighting, skin tone, and camera perspective must all belong naturally to the same person. Hairstyle may adapt naturally to the selected style when needed, but do not replace the person with a prettier generic face or a different person. Keep stable, natural exposure, lighting direction, white balance, and believable complexion; the template atmosphere may change, but the face must not become gray, yellow, orange, overly red, too dark, too bright, overexposed, underexposed, or distorted. Keep the head-to-body proportion natural and photographic, and avoid oversized heads, tiny bodies, or a pasted-on look.`;
}
