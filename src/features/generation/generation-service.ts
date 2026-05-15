import type { SessionUser } from "@/features/auth/session";
import type { CreateGenerationInput } from "@/features/generation/generation-schemas";
import {
  createGenerationRecord,
  markGenerationFailed,
  updateGenerationProviderTask,
} from "@/features/generation/generation-repository";
import { getTemplateById } from "@/features/templates/template-repository";
import {
  assertCanCreateGeneration,
  incrementSubmitCount,
} from "@/features/quota/quota-service";
import { createImageGenerationTask } from "@/lib/apimart/client";
import { config, isMockEnabled } from "@/lib/config";
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

  await assertCanCreateGeneration(input.user);

  if (!isMockEnabled) {
    await incrementSubmitCount(input.user.id);
  }

  const shouldUseMockProvider = isMockEnabled && !config.APIMART_API_KEY;
  const provider = shouldUseMockProvider ? "mock" : "apimart";
  const task = await createGenerationRecord({
    user: input.user,
    input: input.payload,
    submitIp: input.submitIp,
    userAgent: input.userAgent,
    provider,
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
