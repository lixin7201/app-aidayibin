import type { NextRequest } from "next/server";

import { getLifeTestResult } from "@/features/life-test/config/results";
import { renderLifeTestPosterJpeg } from "@/features/life-test/life-test-poster";
import type { LifeTestResultCode } from "@/features/life-test/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ code: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { code } = await params;
  const result = getLifeTestResult(code as LifeTestResultCode);

  if (!result) {
    return new Response("Poster not found", { status: 404 });
  }

  const image = await renderLifeTestPosterJpeg({ result });

  return new Response(new Uint8Array(image), {
    headers: {
      "content-type": "image/jpeg",
      "cache-control": "public, max-age=86400",
    },
  });
}
