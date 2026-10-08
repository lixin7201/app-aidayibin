import { config } from "@/lib/config";

const allowedContentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const allowedOrigins = new Set(
  [
    config.ALIYUN_OSS_PUBLIC_BASE_URL,
    config.CLOUDFLARE_R2_PUBLIC_BASE_URL,
    config.LOCAL_IMAGE_PUBLIC_BASE_URL,
    "https://img.dayibin.cn",
    "https://pic.app.dayibin.cn",
    "https://dayibin.cn",
  ].flatMap((value) => {
    if (!value) {
      return [];
    }

    try {
      return [new URL(value).origin];
    } catch {
      return [];
    }
  }),
);

export function isAllowedRemoteImageUrl(value: string) {
  try {
    return allowedOrigins.has(new URL(value).origin);
  } catch {
    return false;
  }
}

export async function fetchRemoteImageBuffer(
  value: string,
  options: { maxBytes?: number; timeoutMs?: number } = {},
) {
  const maxBytes = options.maxBytes ?? 2 * 1024 * 1024;

  if (!isAllowedRemoteImageUrl(value)) {
    throw new Error("Remote image origin is not allowed");
  }

  const response = await fetch(value, {
    redirect: "error",
    signal: AbortSignal.timeout(options.timeoutMs ?? 3_000),
  });
  const contentType = response.headers.get("content-type")?.split(";")[0];
  const contentLength = Number(response.headers.get("content-length") ?? "0");

  if (
    !response.ok ||
    !contentType ||
    !allowedContentTypes.has(contentType) ||
    (contentLength > 0 && contentLength > maxBytes) ||
    !response.body
  ) {
    throw new Error("Remote image response is invalid");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value: chunk } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += chunk.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new Error("Remote image is too large");
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), totalBytes);
}
