import type { SessionUser } from "@/features/auth/session";
import type { CreateFortuneGenerationInput } from "@/features/fortune/fortune-schemas";
import {
  createFortuneRecord,
  markFortuneFailed,
  updateFortuneProviderTask,
} from "@/features/fortune/fortune-repository";
import {
  buildFortunePrompt,
  fortuneNegativePrompt,
} from "@/features/fortune/fortune-prompts";
import { assertCanCreateFortuneGeneration } from "@/features/fortune/fortune-quota-service";
import { createImageGenerationTask } from "@/lib/apimart/client";
import { config, isMockEnabled } from "@/lib/config";
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

  await assertCanCreateFortuneGeneration(input.user, input.payload.type);

  const shouldUseMockProvider = isMockEnabled && !config.APIMART_API_KEY;
  const provider = shouldUseMockProvider ? "mock" : "apimart";
  const task = await createFortuneRecord({
    user: input.user,
    input: input.payload,
    submitIp: input.submitIp,
    userAgent: input.userAgent,
    provider,
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
