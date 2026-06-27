import { mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

import { config } from "@/lib/config";
import { AppError, errorCodes } from "@/lib/http/errors";
import {
  buildR2PublicUrl,
  createResultCardImageBuffer,
  createResultPreviewImageBuffer,
  createResultShareImageBuffer,
  deleteObject,
  getResultCardImageObjectKey,
  getResultImageObjectKey,
  getResultPreviewImageObjectKey,
  getResultShareImageObjectKey,
  persistRemoteImage,
  uploadUserInputImage as uploadR2UserInputImage,
} from "@/lib/storage/r2";
import {
  buildAliyunOssPublicUrl,
  deleteAliyunOssObject,
  putAliyunOssObject,
} from "@/lib/storage/aliyun-oss";

export type ImageStorageProvider = "r2" | "aliyun_oss" | "local";
export type ResultImageVariant = "original" | "preview" | "share" | "card" | "thumb";

export type PersistedResultImage = {
  provider: ImageStorageProvider;
  originalUrl: string;
  previewUrl: string | null;
  shareUrl: string | null;
  cardUrl: string | null;
  originalObjectKey: string | null;
  previewObjectKey: string | null;
  shareObjectKey: string | null;
  cardObjectKey: string | null;
};

type ObjectToPersist = {
  objectKey: string;
  body: Buffer;
  contentType: string;
};

export async function uploadUserInputImage(input: {
  userId: string;
  fileName: string;
  contentType: string;
  file: Buffer;
}) {
  const provider = getConfiguredProvider();

  if (provider === "r2") {
    return uploadR2UserInputImage(input);
  }

  const extension = input.fileName.split(".").pop()?.toLowerCase() ?? "jpg";
  const objectKey = `temp/${input.userId}/${crypto.randomUUID()}.${extension}`;

  await putProviderObject(provider, {
    objectKey,
    body: input.file,
    contentType: input.contentType,
  });

  return {
    fileUrl: getPublicImageUrl(provider, objectKey),
    objectKey,
  };
}

export async function persistRemoteResultImage(input: {
  imageUrl: string;
  userId: string;
  taskId: string;
}): Promise<PersistedResultImage> {
  const provider = getConfiguredProvider();

  if (input.imageUrl.startsWith("/api/mock-image")) {
    const mockUrl = `${config.NEXT_PUBLIC_APP_URL}${input.imageUrl}`;
    return {
      provider,
      originalUrl: mockUrl,
      previewUrl: mockUrl,
      shareUrl: mockUrl,
      cardUrl: mockUrl,
      originalObjectKey: null,
      previewObjectKey: null,
      shareObjectKey: null,
      cardObjectKey: null,
    };
  }

  if (provider === "r2") {
    const originalUrl = await persistRemoteImage(input);
    return {
      provider,
      originalUrl,
      previewUrl: null,
      shareUrl: null,
      cardUrl: null,
      originalObjectKey: getResultImageObjectKey(input.userId, input.taskId),
      previewObjectKey: null,
      shareObjectKey: null,
      cardObjectKey: null,
    };
  }

  const downloaded = await downloadRemoteImage(input.imageUrl);
  const objectKeys = getResultObjectKeys(input.userId, input.taskId);
  const preview = await createResultPreviewImageBuffer(downloaded.body);
  const share = await createResultShareImageBuffer(downloaded.body);
  const card = await createResultCardImageBuffer(downloaded.body);

  await Promise.all([
    putProviderObject(provider, {
      objectKey: objectKeys.original,
      body: downloaded.body,
      contentType: downloaded.contentType,
    }),
    putProviderObject(provider, {
      objectKey: objectKeys.preview,
      body: preview,
      contentType: "image/webp",
    }),
    putProviderObject(provider, {
      objectKey: objectKeys.share,
      body: share,
      contentType: "image/webp",
    }),
    putProviderObject(provider, {
      objectKey: objectKeys.card,
      body: card,
      contentType: "image/jpeg",
    }),
  ]);

  return {
    provider,
    originalUrl: getPublicImageUrl(provider, objectKeys.original),
    previewUrl: getPublicImageUrl(provider, objectKeys.preview),
    shareUrl: getPublicImageUrl(provider, objectKeys.share),
    cardUrl: getPublicImageUrl(provider, objectKeys.card),
    originalObjectKey: objectKeys.original,
    previewObjectKey: objectKeys.preview,
    shareObjectKey: objectKeys.share,
    cardObjectKey: objectKeys.card,
  };
}

export function getPublicImageUrl(
  provider: ImageStorageProvider,
  objectKey: string,
) {
  if (provider === "aliyun_oss") {
    return buildAliyunOssPublicUrl(objectKey);
  }

  if (provider === "local") {
    if (!config.LOCAL_IMAGE_PUBLIC_BASE_URL) {
      throw new AppError(errorCodes.STORAGE_ERROR, "本地图片访问域名未配置", 500);
    }

    return `${config.LOCAL_IMAGE_PUBLIC_BASE_URL.replace(/\/$/, "")}/${objectKey}`;
  }

  return buildR2PublicUrl(objectKey);
}

export async function deleteImageObject(input: {
  provider?: string | null;
  objectKey?: string | null;
}) {
  if (!input.objectKey) {
    return;
  }

  const provider = normalizeProvider(input.provider) ?? getConfiguredProvider();

  if (provider === "aliyun_oss") {
    await deleteAliyunOssObject(input.objectKey);
    return;
  }

  if (provider === "local") {
    await deleteLocalObject(input.objectKey);
    return;
  }

  await deleteObject(input.objectKey);
}

export function getResultImageUrlFromTask(
  task: {
    storedImageUrl?: string | null;
    previewImageUrl?: string | null;
    shareImageUrl?: string | null;
    cardImageUrl?: string | null;
    publicImageUrl?: string | null;
  },
  variant: ResultImageVariant,
) {
  if (variant === "preview") {
    return task.previewImageUrl ?? null;
  }

  if (variant === "share") {
    return task.shareImageUrl ?? task.publicImageUrl ?? null;
  }

  if (variant === "card") {
    return task.cardImageUrl ?? null;
  }

  if (variant === "thumb") {
    return null;
  }

  return task.storedImageUrl ?? null;
}

function getConfiguredProvider(): ImageStorageProvider {
  return config.IMAGE_STORAGE_PROVIDER;
}

function normalizeProvider(provider?: string | null): ImageStorageProvider | null {
  if (provider === "r2" || provider === "aliyun_oss" || provider === "local") {
    return provider;
  }

  return null;
}

function getResultObjectKeys(userId: string, taskId: string) {
  return {
    original: getResultImageObjectKey(userId, taskId),
    preview: getResultPreviewImageObjectKey(userId, taskId),
    share: getResultShareImageObjectKey(userId, taskId),
    card: getResultCardImageObjectKey(userId, taskId),
  };
}

async function downloadRemoteImage(imageUrl: string) {
  const response = await fetch(new URL(imageUrl, config.NEXT_PUBLIC_APP_URL));

  if (!response.ok) {
    throw new AppError(errorCodes.STORAGE_ERROR, "成品图下载失败", 502);
  }

  return {
    body: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") ?? "image/png",
  };
}

async function putProviderObject(
  provider: ImageStorageProvider,
  object: ObjectToPersist,
) {
  if (provider === "aliyun_oss") {
    await putAliyunOssObject(object);
    return;
  }

  if (provider === "r2") {
    throw new AppError(errorCodes.STORAGE_ERROR, "R2 成品图写入请使用 R2 兼容链路", 500);
  }

  await putLocalObject(object);
}

async function putLocalObject(object: ObjectToPersist) {
  if (!config.LOCAL_IMAGE_STORAGE_DIR) {
    throw new AppError(errorCodes.STORAGE_ERROR, "本地图片存储目录未配置", 500);
  }

  const filePath = getLocalObjectPath(object.objectKey);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, object.body);
}

async function deleteLocalObject(objectKey: string) {
  if (!config.LOCAL_IMAGE_STORAGE_DIR) {
    return;
  }

  try {
    await unlink(getLocalObjectPath(objectKey));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

function getLocalObjectPath(objectKey: string) {
  if (!config.LOCAL_IMAGE_STORAGE_DIR) {
    throw new AppError(errorCodes.STORAGE_ERROR, "本地图片存储目录未配置", 500);
  }

  const filePath = join(config.LOCAL_IMAGE_STORAGE_DIR, objectKey);
  const relativePath = relative(config.LOCAL_IMAGE_STORAGE_DIR, filePath);

  if (relativePath.startsWith("..")) {
    throw new AppError(errorCodes.STORAGE_ERROR, "图片对象路径无效", 500);
  }

  return filePath;
}
