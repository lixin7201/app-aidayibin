import type { NextRequest } from "next/server";

import { requireStoredSessionFromRequest } from "@/features/auth/session";
import { createUploadSignSchema } from "@/features/generation/generation-schemas";
import { apiError, apiOk } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/request";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { createUploadUrl } from "@/lib/storage/r2";

export async function POST(request: NextRequest) {
  try {
    const user = await requireStoredSessionFromRequest(request);
    const body = createUploadSignSchema.parse(await parseJsonBody(request));

    await assertRateLimit(`upload_sign:user:${user.id}:1m`, {
      window: "1m",
      maxRequests: 10,
    });
    await assertRateLimit(`upload_sign:user:${user.id}:1d`, {
      window: "1d",
      maxRequests: 50,
    });
    await assertRateLimit(`upload_sign_bytes:user:${user.id}:1d`, {
      window: "1d",
      maxRequests: 500,
      increment: Math.max(1, Math.ceil(body.file_size / (1024 * 1024))),
    });

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
