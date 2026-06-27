import type { NextRequest } from "next/server";

import { requireStoredSessionFromRequest } from "@/features/auth/session";
import {
  getPublicFortuneGenerationById,
  getUserFortuneGenerationById,
} from "@/features/fortune/fortune-repository";
import { verifyImageToken } from "@/lib/auth/image-token";
import {
  getResultImageBuffer,
  getResultImageObject,
  getResultPreviewImageObject,
  getResultShareImageObject,
  getResultCardImageObject,
  createResultShareThumbImageBuffer,
  persistResultPreviewImage,
  persistResultShareImage,
  persistResultCardImage,
} from "@/lib/storage/r2";
import {
  getResultImageUrlFromTask,
  type ResultImageVariant,
} from "@/lib/storage/image-storage";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const isPublicRead = request.nextUrl.searchParams.get("public") === "1";
    const generation = isPublicRead
      ? await getPublicFortuneGenerationById(id)
      : await getUserFortuneGenerationById(
          (await requireStoredSessionFromRequest(request)).id,
          id,
        );

    if (!generation?.storedImageUrl || generation.status !== "succeeded") {
      return new Response("Image not found", { status: 404 });
    }

    if (isPublicRead) {
      const token = request.nextUrl.searchParams.get("t");
      const rawVariant = request.nextUrl.searchParams.get("variant");
      const variant = rawVariant ?? "share";

      if (
        !token ||
        (variant !== "share" &&
          variant !== "original" &&
          variant !== "card" &&
          variant !== "thumb") ||
        !verifyImageToken(token, "fortune", id, variant)
      ) {
        return new Response("Image not found", { status: 404 });
      }
    }

    const requestedVariant = getRequestedVariant(request);
    const directImageUrl = getResultImageUrlFromTask(generation, requestedVariant);

    if (directImageUrl && !isResultImageApiUrl(directImageUrl, request.url)) {
      return Response.redirect(new URL(directImageUrl, request.url), 302);
    }

    if (request.nextUrl.searchParams.get("preview") === "1") {
      try {
        const preview = await getResultPreviewImageObject({
          userId: generation.userId,
          taskId: id,
        });
        const headers = new Headers({
          "cache-control": isPublicRead
            ? "public, max-age=86400"
            : "private, max-age=86400",
          "content-type": preview.contentType,
        });

        if (preview.contentLength) {
          headers.set("content-length", String(preview.contentLength));
        }

        if (preview.etag) {
          headers.set("etag", preview.etag);
        }

        if (preview.lastModified) {
          headers.set("last-modified", preview.lastModified.toUTCString());
        }

        return new Response(preview.body, { headers });
      } catch {
        const image = await getResultImageBuffer({
          userId: generation.userId,
          taskId: id,
        });
        const preview = await persistResultPreviewImage({
          userId: generation.userId,
          taskId: id,
          source: image.buffer,
        });

        return new Response(new Uint8Array(preview.buffer), {
          headers: {
            "cache-control": isPublicRead
              ? "public, max-age=86400"
              : "private, max-age=86400",
            "content-length": String(preview.contentLength),
            "content-type": "image/webp",
            ...(image.etag ? { etag: `W/${image.etag}` } : {}),
            ...(image.lastModified
              ? { "last-modified": image.lastModified.toUTCString() }
              : {}),
          },
        });
      }
    }

    const variant = request.nextUrl.searchParams.get("variant") ?? "original";

    if (variant === "thumb") {
      const image = await getResultImageBuffer({
        userId: generation.userId,
        taskId: id,
      });
      const thumb = await createResultShareThumbImageBuffer(image.buffer);

      return new Response(new Uint8Array(thumb), {
        headers: {
          "cache-control": isPublicRead
            ? "public, max-age=86400"
            : "private, max-age=86400",
          "content-length": String(thumb.byteLength),
          "content-type": "image/jpeg",
          ...(image.etag ? { etag: `W/${image.etag}-thumb` } : {}),
          ...(image.lastModified
            ? { "last-modified": image.lastModified.toUTCString() }
            : {}),
        },
      });
    }

    if (variant === "share") {
      try {
        const share = await getResultShareImageObject({
          userId: generation.userId,
          taskId: id,
        });
        const headers = new Headers({
          "cache-control": isPublicRead
            ? "public, max-age=86400"
            : "private, max-age=86400",
          "content-type": share.contentType,
        });

        if (share.contentLength) {
          headers.set("content-length", String(share.contentLength));
        }

        if (share.etag) {
          headers.set("etag", share.etag);
        }

        if (share.lastModified) {
          headers.set("last-modified", share.lastModified.toUTCString());
        }

        return new Response(share.body, { headers });
      } catch {
        const image = await getResultImageBuffer({
          userId: generation.userId,
          taskId: id,
        });
        const share = await persistResultShareImage({
          userId: generation.userId,
          taskId: id,
          source: image.buffer,
        });

        return new Response(new Uint8Array(share.buffer), {
          headers: {
            "cache-control": isPublicRead
              ? "public, max-age=86400"
              : "private, max-age=86400",
            "content-length": String(share.contentLength),
            "content-type": "image/webp",
            ...(image.etag ? { etag: `W/${image.etag}` } : {}),
            ...(image.lastModified
              ? { "last-modified": image.lastModified.toUTCString() }
              : {}),
          },
        });
      }
    }

    if (variant === "card") {
      try {
        const card = await getResultCardImageObject({
          userId: generation.userId,
          taskId: id,
        });
        const headers = new Headers({
          "cache-control": isPublicRead
            ? "public, max-age=86400"
            : "private, max-age=86400",
          "content-type": card.contentType,
        });

        if (card.contentLength) {
          headers.set("content-length", String(card.contentLength));
        }

        if (card.etag) {
          headers.set("etag", card.etag);
        }

        if (card.lastModified) {
          headers.set("last-modified", card.lastModified.toUTCString());
        }

        return new Response(card.body, { headers });
      } catch {
        const image = await getResultImageBuffer({
          userId: generation.userId,
          taskId: id,
        });
        const card = await persistResultCardImage({
          userId: generation.userId,
          taskId: id,
          source: image.buffer,
        });

        return new Response(new Uint8Array(card.buffer), {
          headers: {
            "cache-control": isPublicRead
              ? "public, max-age=86400"
              : "private, max-age=86400",
            "content-length": String(card.contentLength),
            "content-type": "image/jpeg",
            ...(image.etag ? { etag: `W/${image.etag}` } : {}),
            ...(image.lastModified
              ? { "last-modified": image.lastModified.toUTCString() }
              : {}),
          },
        });
      }
    }

    const image = await getResultImageObject({
      userId: generation.userId,
      taskId: id,
    });
    const headers = new Headers({
      "cache-control": isPublicRead
        ? "public, max-age=86400"
        : "private, max-age=300",
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

function getRequestedVariant(request: NextRequest): ResultImageVariant {
  if (request.nextUrl.searchParams.get("preview") === "1") {
    return "preview";
  }

  const variant = request.nextUrl.searchParams.get("variant");

  if (
    variant === "share" ||
    variant === "card" ||
    variant === "original" ||
    variant === "thumb"
  ) {
    return variant;
  }

  return "original";
}

function isResultImageApiUrl(imageUrl: string, requestUrl: string) {
  const url = new URL(imageUrl, requestUrl);
  return /\/api\/fortune\/generations\/[^/]+\/image$/.test(url.pathname);
}
