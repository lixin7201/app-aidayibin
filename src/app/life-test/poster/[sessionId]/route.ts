import type { NextRequest } from "next/server";

import { lifeTestCityConfig } from "@/features/life-test/config/city";
import { renderLifeTestPosterJpeg } from "@/features/life-test/life-test-poster";
import { getLifeTestSession } from "@/features/life-test/life-test-service";
import { getSessionFromRequest } from "@/features/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const session = await getLifeTestSession(sessionId);

    if (!session.result) {
      return new Response("Poster not ready", { status: 404 });
    }

    const pageUrl = new URL(`/ai/life-test/result/${sessionId}`, request.url).toString();
    const currentUser = getSessionFromRequest(request);
    const image = await renderLifeTestPosterJpeg({
      nickname: session.nickname,
      avatarUrl:
        session.avatarUrl ??
        (currentUser?.nickname === session.nickname ? currentUser.avatarUrl : null),
      result: session.result,
      score: session.score,
      pageUrl,
    });

    return new Response(new Uint8Array(image), {
      headers: {
        "content-type": "image/jpeg",
        "cache-control": "no-store",
        "content-disposition": `inline; filename="${encodeURIComponent(lifeTestCityConfig.title)}.jpg"`,
      },
    });
  } catch {
    return new Response("Poster not found", { status: 404 });
  }
}
