import type { NextRequest } from "next/server";

import { requireGaokaoAdminRequest } from "@/features/gaokao/gaokao-admin-auth";
import { listGaokaoAdminUsers } from "@/features/gaokao/gaokao-admin-service";
import { apiError, apiOk } from "@/lib/http/errors";

export async function GET(request: NextRequest) {
  try {
    await requireGaokaoAdminRequest(request);
    const search = new URL(request.url).searchParams.get("q");
    const users = await listGaokaoAdminUsers({ search });

    return apiOk({ users });
  } catch (error) {
    return apiError(error);
  }
}
