import type { NextRequest } from "next/server";

import { requireAdminRequest } from "@/features/admin/require-admin";
import {
  exportLifeTestLeadsCsv,
  exportLifeTestSessionsCsv,
} from "@/features/life-test/life-test-service";
import { apiError } from "@/lib/http/errors";

export async function GET(request: NextRequest) {
  try {
    requireAdminRequest(request);

    const type = request.nextUrl.searchParams.get("type");
    const isLeads = type === "leads";
    const csv = isLeads
      ? await exportLifeTestLeadsCsv()
      : await exportLifeTestSessionsCsv();

    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${
          isLeads ? "life-test-leads" : "life-test-sessions"
        }.csv"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
