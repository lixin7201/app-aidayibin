import type { NextRequest } from "next/server";

import { requireStoredSessionFromRequest } from "@/features/auth/session";
import { apiError, apiOk, AppError, errorCodes } from "@/lib/http/errors";
import { uploadUserInputImage } from "@/lib/storage/r2";

const acceptedContentTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 15 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const user = await requireStoredSessionFromRequest(request);
    const formData = await request.formData();
    const file = formData.get("file");

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
        "图片大小不能超过 15MB",
        400,
      );
    }

    const upload = await uploadUserInputImage({
      userId: user.id,
      fileName: file.name,
      contentType: file.type,
      file: Buffer.from(await file.arrayBuffer()),
    });

    return apiOk({
      file_url: upload.fileUrl,
      object_key: upload.objectKey,
    });
  } catch (error) {
    return apiError(error);
  }
}
