import type { NextRequest } from "next/server";

import { requireStoredSessionFromRequest } from "@/features/auth/session";
import { getUserFortuneGenerationById } from "@/features/fortune/fortune-repository";
import { getResultImageObject } from "@/lib/storage/r2";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireStoredSessionFromRequest(request);
    const { id } = await params;
    const generation = await getUserFortuneGenerationById(user.id, id);

    if (!generation?.storedImageUrl || generation.status !== "succeeded") {
      return new Response("Image not found", { status: 404 });
    }

    const image = await getResultImageObject({ userId: user.id, taskId: id });
    const headers = new Headers({
      "cache-control": "private, max-age=300",
      "content-type": image.contentType,
    });

    if (image.contentLength) {
      headers.set("content-length", String(image.contentLength));
    }

    if (image.etag) {
      headers.set("etag", image.etag);
    }

    if (image.lastModified) {
      headers.set("last-modified", image.lastModified.toUTCString());
    }

    return new Response(image.body, { headers });
  } catch {
    return new Response("Image not found", { status: 404 });
  }
}
