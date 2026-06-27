import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { config } from "@/lib/config";
import { AppError, errorCodes } from "@/lib/http/errors";

let aliyunOssClient: S3Client | null = null;

function getAliyunOssEndpoint() {
  if (config.ALIYUN_OSS_ENDPOINT) {
    return config.ALIYUN_OSS_ENDPOINT;
  }

  if (!config.ALIYUN_OSS_REGION) {
    return null;
  }

  return `https://oss-${config.ALIYUN_OSS_REGION}.aliyuncs.com`;
}

function getAliyunOssClient() {
  if (
    !config.ALIYUN_OSS_REGION ||
    !config.ALIYUN_OSS_ACCESS_KEY_ID ||
    !config.ALIYUN_OSS_ACCESS_KEY_SECRET
  ) {
    return null;
  }

  if (!aliyunOssClient) {
    const endpoint = getAliyunOssEndpoint();

    if (!endpoint) {
      return null;
    }

    aliyunOssClient = new S3Client({
      region: config.ALIYUN_OSS_REGION,
      endpoint,
      credentials: {
        accessKeyId: config.ALIYUN_OSS_ACCESS_KEY_ID,
        secretAccessKey: config.ALIYUN_OSS_ACCESS_KEY_SECRET,
      },
    });
  }

  return aliyunOssClient;
}

export async function putAliyunOssObject(input: {
  objectKey: string;
  body: Buffer;
  contentType: string;
}) {
  const client = getAliyunOssClient();

  if (!client || !config.ALIYUN_OSS_BUCKET) {
    throw new AppError(errorCodes.STORAGE_ERROR, "阿里云 OSS 未配置", 500);
  }

  await client.send(
    new PutObjectCommand({
      Bucket: config.ALIYUN_OSS_BUCKET,
      Key: input.objectKey,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: "public, max-age=2592000, immutable",
    }),
  );
}

export async function deleteAliyunOssObject(objectKey: string) {
  const client = getAliyunOssClient();

  if (!client || !config.ALIYUN_OSS_BUCKET) {
    return;
  }

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.ALIYUN_OSS_BUCKET,
      Key: objectKey,
    }),
  );
}

export function buildAliyunOssPublicUrl(objectKey: string) {
  if (!config.ALIYUN_OSS_PUBLIC_BASE_URL) {
    throw new AppError(errorCodes.STORAGE_ERROR, "阿里云 OSS 访问域名未配置", 500);
  }

  return `${config.ALIYUN_OSS_PUBLIC_BASE_URL.replace(/\/$/, "")}/${objectKey}`;
}
