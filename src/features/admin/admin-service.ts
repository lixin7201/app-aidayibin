import { getFortuneSystemLimits } from "@/features/fortune/fortune-quota-service";
import { getBeijingDate, getSystemLimits } from "@/features/quota/quota-service";
import type { PhotoTemplateRecord } from "@/lib/db/database.types";
import { prisma } from "@/lib/db/prisma";
import {
  toFortuneGenerationTaskRecord,
  toGenerationTaskRecord,
} from "@/lib/db/records";

export async function getAdminDashboard() {
  const limits = await getSystemLimits();
  const fortuneLimits = await getFortuneSystemLimits();

  const today = getBeijingDate();
  const start = new Date(`${today}T00:00:00+08:00`);
  const [
    submitted,
    succeeded,
    failed,
    fortuneSubmitted,
    fortuneSucceeded,
    fortunePalmSubmitted,
    fortuneFaceSubmitted,
    activeUsers,
    topTemplatesResult,
  ] = await Promise.all([
    prisma.generationTask.count({ where: { created_at: { gte: start } } }),
    prisma.generationTask.count({
      where: { status: "succeeded", created_at: { gte: start } },
    }),
    prisma.generationTask.count({
      where: { status: "failed", created_at: { gte: start } },
    }),
    prisma.fortuneGenerationTask.count({
      where: { created_at: { gte: start } },
    }),
    prisma.fortuneGenerationTask.count({
      where: { status: "succeeded", created_at: { gte: start } },
    }),
    prisma.fortuneGenerationTask.count({
      where: { fortune_type: "palm", created_at: { gte: start } },
    }),
    prisma.fortuneGenerationTask.count({
      where: { fortune_type: "face", created_at: { gte: start } },
    }),
    prisma.generationTask.findMany({
      where: { created_at: { gte: start } },
      select: { user_id: true },
    }),
    prisma.generationTask.findMany({
      where: { status: "succeeded", created_at: { gte: start } },
      select: {
        template_id: true,
        photo_templates: { select: { name: true } },
      },
    }),
  ]);

  const activeUserCount = new Set(
    activeUsers.map((item) => item.user_id),
  ).size;
  const topTemplateMap = new Map<string, { name: string; count: number }>();

  for (const task of topTemplatesResult) {
    const typedTask = task as {
      template_id: string;
      photo_templates?: Pick<PhotoTemplateRecord, "name"> | null;
    };
    const current = topTemplateMap.get(typedTask.template_id);
    topTemplateMap.set(typedTask.template_id, {
      name: typedTask.photo_templates?.name ?? "未知模板",
      count: (current?.count ?? 0) + 1,
    });
  }

  const todaySubmitted = submitted;
  const todaySucceeded = succeeded;

  return {
    metrics: {
        todaySubmitted,
        todaySucceeded,
        todayFailed: failed,
        fortuneTodaySubmitted: fortuneSubmitted,
        fortuneTodaySucceeded: fortuneSucceeded,
        fortunePalmSubmitted: fortunePalmSubmitted,
        fortuneFaceSubmitted: fortuneFaceSubmitted,
        activeUsers: activeUserCount,
        successRate:
          todaySubmitted > 0
          ? Math.round((todaySucceeded / todaySubmitted) * 100)
          : 0,
    },
    limits,
    fortuneLimits,
    topTemplates: Array.from(topTemplateMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  };
}

export async function listAdminGenerations() {
  const data = await prisma.generationTask.findMany({
    orderBy: { created_at: "desc" },
    take: 100,
  });

  return data.map((task) => toGenerationTaskRecord(task));
}

export async function listAdminFortuneGenerations() {
  const data = await prisma.fortuneGenerationTask.findMany({
    orderBy: { created_at: "desc" },
    take: 100,
  });

  return data.map((task) => toFortuneGenerationTaskRecord(task));
}
