import type { NextRequest } from "next/server";
import { requireStoredSessionFromRequest } from "@/features/auth/session";
import { apiError, apiOk, AppError, errorCodes } from "@/lib/http/errors";
import sharp from "@/lib/image/sharp";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { uploadUserInputImage } from "@/lib/storage/image-storage";

const acceptedContentTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 30 * 1024 * 1024;
const compressionThreshold = 4 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const user = await requireStoredSessionFromRequest(request);

    await assertRateLimit(`uploads:user:${user.id}:1m`, {
      window: "1m",
      maxRequests: 10,
    });
    await assertRateLimit(`uploads:user:${user.id}:1d`, {
      window: "1d",
      maxRequests: 50,
    });

    const formData = await request.formData();
    const file = formData.get("file");

    if (file instanceof File) {
      const mbSize = Math.max(1, Math.ceil(file.size / (1024 * 1024)));
      await assertRateLimit(`uploads_bytes:user:${user.id}:1d`, {
        window: "1d",
        maxRequests: 500,
        increment: mbSize,
      });
    }

    if (!(file instanceof File)) {
      throw new AppError(errorCodes.INVALID_IMAGE_FORMAT, "请上传图片文件", 400);
    }

    if (!acceptedContentTypes.has(file.type)) {
      throw new AppError(
        errorCodes.INVALID_IMAGE_FORMAT,
        "仅支持 JPG、PNG、WEBP 图片",
        400,
      );
    }

    if (file.size <= 0 || file.size > maxFileSize) {
      throw new AppError(
        errorCodes.INVALID_IMAGE_FORMAT,
        "图片大小不能超过 30MB",
        400,
      );
    }

    const normalized = await normalizeUploadImage(file);
    const upload = await uploadUserInputImage({
      userId: user.id,
      fileName: normalized.fileName,
      contentType: normalized.contentType,
      file: normalized.file,
    });

    return apiOk({
      file_url: upload.fileUrl,
      object_key: upload.objectKey,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function normalizeUploadImage(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedContentType = detectImageContentType(buffer);

  if (!detectedContentType || detectedContentType !== file.type) {
    throw new AppError(
      errorCodes.INVALID_IMAGE_FORMAT,
      "图片内容与文件格式不一致",
      400,
    );
  }

  try {
    const metadata = await sharp(buffer, {
      failOn: "error",
      limitInputPixels: 40_000_000,
    }).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("missing image dimensions");
    }
  } catch {
    throw new AppError(errorCodes.INVALID_IMAGE_FORMAT, "图片文件无效", 400);
  }

  try {
    let quality = 88;
    let output = await sharp(buffer, {
      failOn: "error",
      limitInputPixels: 40_000_000,
    })
      .rotate()
      .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    while (output.byteLength > compressionThreshold && quality > 72) {
      quality -= 6;
      output = await sharp(buffer, {
        failOn: "error",
        limitInputPixels: 40_000_000,
      })
        .rotate()
        .resize({
          width: 1800,
          height: 1800,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
    }

    return {
      file: output,
      contentType: "image/jpeg",
      fileName: getUploadFileName(file.name),
    };
  } catch {
    throw new AppError(errorCodes.INVALID_IMAGE_FORMAT, "图片处理失败", 400);
  }
}

function detectImageContentType(buffer: Buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

function getUploadFileName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") + ".jpg";
}
