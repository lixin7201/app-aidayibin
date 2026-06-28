import type { NextRequest } from "next/server";

import { requireStoredSessionFromRequest } from "@/features/auth/session";
import { createGaokaoReportSchema } from "@/features/gaokao/gaokao-schemas";
import {
  getGaokaoDataStatus,
  getGaokaoGenerationStatus,
  listGaokaoReports,
} from "@/features/gaokao/gaokao-repository";
import { saveGaokaoReport } from "@/features/gaokao/gaokao-service";
import { apiError, apiOk } from "@/lib/http/errors";
import { getClientIp, getUserAgent, parseJsonBody } from "@/lib/http/request";
import { assertRateLimit } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const user = await requireStoredSessionFromRequest(request);
    const [reports, dataStatus, generationStatus] = await Promise.all([
      listGaokaoReports(user.id),
      getGaokaoDataStatus(),
      getGaokaoGenerationStatus(user.id),
    ]);

    return apiOk({ reports, dataStatus, generationStatus });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireStoredSessionFromRequest(request);

    await assertRateLimit(`gaokao_report:user:${user.id}`, {
      window: "10m",
      maxRequests: 8,
    });

    const payload = createGaokaoReportSchema.parse(await parseJsonBody(request));
    const report = await saveGaokaoReport({
      user,
      title: payload.title,
      profile: payload.profile,
      recommendations: payload.recommendations,
      summary: payload.summary,
      submitIp: getClientIp(request),
      userAgent: getUserAgent(request),
    });
    const generationStatus = await getGaokaoGenerationStatus(user.id);

    return apiOk({ report, generationStatus });
  } catch (error) {
    return apiError(error);
  }
}
