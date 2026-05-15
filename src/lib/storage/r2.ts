import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { config, isMockEnabled } from "@/lib/config";
import { AppError, errorCodes } from "@/lib/http/errors";
import { apiPath } from "@/lib/routes";

let r2Client: S3Client | null = null;

function getR2Client() {
  if (
    !config.CLOUDFLARE_R2_ACCOUNT_ID ||
    !config.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    !config.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  ) {
    return null;
  }

  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${config.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: config.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return r2Client;
}

export async function createUploadUrl(input: {
  userId: string;
  fileName: string;
  contentType: string;
}) {
  const extension = input.fileName.split(".").pop()?.toLowerCase() ?? "jpg";
  const objectKey = `temp/${input.userId}/${crypto.randomUUID()}.${extension}`;

  if (isMockEnabled && !getR2Client()) {
    return {
      uploadUrl: apiPath("/uploads/mock"),
      fileUrl: `${config.NEXT_PUBLIC_APP_URL}/api/mock-image/uploaded-reference`,
      objectKey,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };
  }

  const client = getR2Client();

  if (!client || !config.CLOUDFLARE_R2_BUCKET) {
    throw new AppError(errorCodes.STORAGE_ERROR, "图片存储未配置", 500);
  }

  const command = new PutObjectCommand({
    Bucket: config.CLOUDFLARE_R2_BUCKET,
    Key: objectKey,
    ContentType: input.contentType,
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 600 });

  return {
    uploadUrl,
    fileUrl: buildPublicUrl(objectKey),
    objectKey,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  };
}

export async function uploadUserInputImage(input: {
  userId: string;
  fileName: string;
  contentType: string;
  file: Buffer;
}) {
  const extension = input.fileName.split(".").pop()?.toLowerCase() ?? "jpg";
  const objectKey = `temp/${input.userId}/${crypto.randomUUID()}.${extension}`;

  if (isMockEnabled && !getR2Client()) {
    return {
      fileUrl: `${config.NEXT_PUBLIC_APP_URL}/api/mock-image/uploaded-reference`,
      objectKey,
    };
  }

  const client = getR2Client();

  if (!client || !config.CLOUDFLARE_R2_BUCKET) {
    throw new AppError(errorCodes.STORAGE_ERROR, "图片存储未配置", 500);
  }

  await client.send(
    new PutObjectCommand({
      Bucket: config.CLOUDFLARE_R2_BUCKET,
      Key: objectKey,
      Body: input.file,
      ContentType: input.contentType,
    }),
  );

  return {
    fileUrl: buildPublicUrl(objectKey),
    objectKey,
  };
}

export async function persistRemoteImage(input: {
  imageUrl: string;
  userId: string;
  taskId: string;
}) {
  if (input.imageUrl.startsWith("/api/mock-image")) {
    return `${config.NEXT_PUBLIC_APP_URL}${input.imageUrl}`;
  }

  if (isMockEnabled && !getR2Client()) {
    return input.imageUrl;
  }

  const client = getR2Client();

  if (!client || !config.CLOUDFLARE_R2_BUCKET) {
    throw new AppError(errorCodes.STORAGE_ERROR, "图片存储未配置", 500);
  }

  const response = await fetch(input.imageUrl);

  if (!response.ok) {
    throw new AppError(errorCodes.STORAGE_ERROR, "成品图下载失败", 502);
  }

  const body = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") ?? "image/png";
  const objectKey = `results/${input.userId}/${input.taskId}.png`;

  await client.send(
    new PutObjectCommand({
      Bucket: config.CLOUDFLARE_R2_BUCKET,
      Key: objectKey,
      Body: body,
      ContentType: contentType,
    }),
  );

  return buildPublicUrl(objectKey);
}

export async function getResultImageObject(input: {
  userId: string;
  taskId: string;
}) {
  const client = getR2Client();

  if (!client || !config.CLOUDFLARE_R2_BUCKET) {
    throw new AppError(errorCodes.STORAGE_ERROR, "图片存储未配置", 500);
  }

  const objectKey = `results/${input.userId}/${input.taskId}.png`;
  const output = await client.send(
    new GetObjectCommand({
      Bucket: config.CLOUDFLARE_R2_BUCKET,
      Key: objectKey,
    }),
  );

  if (!output.Body) {
    throw new AppError(errorCodes.STORAGE_ERROR, "成品图不存在", 404);
  }

  return {
    body: output.Body.transformToWebStream(),
    contentLength: output.ContentLength,
    contentType: output.ContentType ?? "image/png",
    etag: output.ETag,
    lastModified: output.LastModified,
  };
}

export async function deleteObject(objectKey: string) {
  const client = getR2Client();

  if (!client || !config.CLOUDFLARE_R2_BUCKET) {
    return;
  }

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.CLOUDFLARE_R2_BUCKET,
      Key: objectKey,
    }),
  );
}

function buildPublicUrl(objectKey: string) {
  if (!config.CLOUDFLARE_R2_PUBLIC_BASE_URL) {
    throw new AppError(errorCodes.STORAGE_ERROR, "图片访问域名未配置", 500);
  }

  return `${config.CLOUDFLARE_R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${objectKey}`;
}
