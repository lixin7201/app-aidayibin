import type { NextRequest } from "next/server";

import { requireStoredSessionFromRequest } from "@/features/auth/session";
import { createUploadSignSchema } from "@/features/generation/generation-schemas";
import { apiError, apiOk } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/request";
import { createUploadUrl } from "@/lib/storage/r2";

export async function POST(request: NextRequest) {
  try {
    const user = await requireStoredSessionFromRequest(request);
    const body = createUploadSignSchema.parse(await parseJsonBody(request));
    const upload = await createUploadUrl({
      userId: user.id,
      fileName: body.file_name,
      contentType: body.content_type,
    });

    return apiOk({
      upload_url: upload.uploadUrl,
      file_url: upload.fileUrl,
      object_key: upload.objectKey,
      expires_at: upload.expiresAt,
    });
  } catch (error) {
    return apiError(error);
  }
}
