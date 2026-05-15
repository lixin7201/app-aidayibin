import { config, isMockEnabled, requireServerEnv } from "@/lib/config";
import { AppError, errorCodes } from "@/lib/http/errors";

type CreateTaskInput = {
  prompt: string;
  negativePrompt: string;
  imageUrls: string[];
  ratio: string;
  resolution: string;
};

type ProviderCreateResult = {
  providerTaskId: string;
};

export type ProviderTaskResult = {
  status: "pending" | "processing" | "succeeded" | "failed";
  imageUrl?: string;
  errorCode?: string;
  errorMessage?: string;
};

export async function createImageGenerationTask(
  input: CreateTaskInput,
): Promise<ProviderCreateResult> {
  if (isMockEnabled && !config.APIMART_API_KEY) {
    return {
      providerTaskId: `mock-${crypto.randomUUID()}`,
    };
  }

  const apiKey = requireServerEnv("APIMART_API_KEY");
  const response = await fetch(
    `${config.APIMART_BASE_URL}/v1/images/generations`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-2",
        prompt: input.prompt,
        negative_prompt: input.negativePrompt,
        image_urls: input.imageUrls,
        size: input.ratio,
        resolution: input.resolution,
        n: 1,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new AppError(
      errorCodes.PROVIDER_ERROR,
      `AI 服务提交失败：${errorText || response.statusText}`,
      502,
    );
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const firstDataItem = Array.isArray(payload.data)
    ? ((payload.data[0] ?? {}) as Record<string, unknown>)
    : ((payload.data ?? {}) as Record<string, unknown>);
  const providerTaskId =
    findString(payload, ["task_id", "id"]) ??
    findString(firstDataItem, ["task_id", "id"]);

  if (!providerTaskId) {
    throw new AppError(
      errorCodes.PROVIDER_ERROR,
      "AI 服务未返回任务 ID",
      502,
    );
  }

  return { providerTaskId };
}

export async function getImageGenerationTask(
  providerTaskId: string,
): Promise<ProviderTaskResult> {
  if (providerTaskId.startsWith("mock-")) {
    return {
      status: "succeeded",
      imageUrl: "/api/mock-image/minimal-white-studio",
    };
  }

  const apiKey = requireServerEnv("APIMART_API_KEY");
  const response = await fetch(
    `${config.APIMART_BASE_URL}/v1/tasks/${providerTaskId}`,
    {
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new AppError(
      errorCodes.PROVIDER_ERROR,
      `AI 服务查询失败：${errorText || response.statusText}`,
      502,
    );
  }

  const payload = (await response.json()) as Record<string, unknown>;
  return normalizeProviderTask(payload);
}

function normalizeProviderTask(payload: Record<string, unknown>) {
  const statusValue =
    findString(payload, ["status", "state"]) ??
    findString((payload.data ?? {}) as Record<string, unknown>, [
      "status",
      "state",
    ]);
  const normalizedStatus = normalizeProviderStatus(statusValue);
  const data = (payload.data ?? payload) as Record<string, unknown>;
  const result = (data.result ?? {}) as Record<string, unknown>;
  const error = (data.error ?? payload.error ?? {}) as Record<string, unknown>;
  const imageUrl =
    findString(data, ["image_url", "url", "result_url", "output_url"]) ??
    findFirstImageUrl(data.output) ??
    findFirstImageUrl(data.images) ??
    findFirstImageUrl(result.images);

  return {
    status: normalizedStatus,
    imageUrl,
    errorCode:
      findString(error, ["error_code", "code"]) ??
      findString(data, ["error_code", "code"]),
    errorMessage:
      findString(error, ["error_message", "message", "error"]) ??
      findString(data, ["error_message", "message", "error"]),
  } satisfies ProviderTaskResult;
}

function normalizeProviderStatus(status: string | undefined) {
  const value = status?.toLowerCase();

  if (!value) {
    return "processing";
  }

  if (["success", "succeeded", "completed", "done"].includes(value)) {
    return "succeeded";
  }

  if (["failed", "failure", "error"].includes(value)) {
    return "failed";
  }

  if (["pending", "queued", "waiting", "submitted"].includes(value)) {
    return "pending";
  }

  return "processing";
}

function findString(
  object: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = object[key];

    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return undefined;
}

function findFirstImageUrl(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string") {
        return item;
      }

      if (Array.isArray(item)) {
        const nestedUrl = findFirstImageUrl(item);

        if (nestedUrl) {
          return nestedUrl;
        }
      }

      if (item && typeof item === "object") {
        const itemRecord = item as Record<string, unknown>;
        const url = findString(itemRecord, [
          "url",
          "image_url",
          "result_url",
        ]);

        if (url) {
          return url;
        }

        const nestedUrl =
          findFirstImageUrl(itemRecord.url) ??
          findFirstImageUrl(itemRecord.image_url) ??
          findFirstImageUrl(itemRecord.result_url);

        if (nestedUrl) {
          return nestedUrl;
        }
      }
    }
  }

  return undefined;
}
