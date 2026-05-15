import type { NextRequest } from "next/server";

import { requireStoredSessionFromRequest } from "@/features/auth/session";
import { getUserGenerationById } from "@/features/generation/generation-repository";
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
    const generation = await getUserGenerationById(user.id, id);

    if (!generation?.storedImageUrl || generation.status !== "succeeded") {
      return new Response("Image not found", { status: 404 });
    }

    const storedImageUrl = new URL(generation.storedImageUrl, request.url);

    if (storedImageUrl.pathname.includes("/api/mock-image/")) {
      const response = await fetch(storedImageUrl);

      if (!response.ok || !response.body) {
        return new Response("Image not found", { status: 404 });
      }

      return new Response(response.body, {
        headers: {
          "cache-control": "private, max-age=300",
          "content-type": response.headers.get("content-type") ?? "image/svg+xml",
        },
      });
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
