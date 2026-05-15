import type { NextRequest } from "next/server";

import {
  listAdminFortuneGenerations,
  listAdminGenerations,
} from "@/features/admin/admin-service";
import { requireAdminRequest } from "@/features/admin/require-admin";
import { apiError } from "@/lib/http/errors";

export async function GET(request: NextRequest) {
  try {
    requireAdminRequest(request);
    const [generations, fortuneGenerations] = await Promise.all([
      listAdminGenerations(),
      listAdminFortuneGenerations(),
    ]);
    const header = [
      "module",
      "id",
      "user_id",
      "feature_or_template",
      "status",
      "ratio",
      "resolution",
      "created_at",
      "completed_at",
      "error_message",
    ];
    const rows = generations.map((task) =>
      [
        "portrait_display",
        task.id,
        task.user_id,
        task.template_id,
        task.status,
        task.ratio,
        task.resolution,
        task.created_at,
        task.completed_at ?? "",
        task.error_message ?? "",
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    );
    const fortuneRows = fortuneGenerations.map((task) =>
      [
        task.feature_type,
        task.id,
        task.user_id,
        task.fortune_type,
        task.status,
        task.ratio,
        task.resolution,
        task.created_at,
        task.completed_at ?? "",
        task.error_message ?? "",
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    );

    return new Response([header.join(","), ...rows, ...fortuneRows].join("\n"), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="generations.csv"',
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
