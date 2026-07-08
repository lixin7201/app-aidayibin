import type { Prisma } from "@prisma/client";

import type { SessionUser } from "@/features/auth/session";
import { isGaokaoAdminAppUserId } from "@/features/gaokao/gaokao-admin-auth";
import {
  getGaokaoGenerationStatus,
  isUnlimitedGaokaoUser,
} from "@/features/gaokao/gaokao-repository";
import { prisma } from "@/lib/db/prisma";
import { AppError, errorCodes } from "@/lib/http/errors";

export type GaokaoAdminUserRow = {
  id: string;
  appUserId: string;
  nickname: string;
  status: string;
  lastSeenAt: string | null;
  createdAt: string;
  gaokaoReports: number;
  activeGaokaoReports: number;
  deletedGaokaoReports: number;
  photoTasks: number;
  fortuneTasks: number;
  canGenerate: boolean;
  isUnlimited: boolean;
  isBuiltInAdmin: boolean;
  latestReportAt: string | null;
};

type AppUserSummary = {
  id: string;
  app_user_id: string;
  nickname: string | null;
  status: string;
  created_at: Date;
  last_seen_at: Date | null;
};

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

async function getTargetUser(userId: string) {
  const user = await prisma.appUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      app_user_id: true,
      nickname: true,
      status: true,
      created_at: true,
      last_seen_at: true,
    },
  });

  if (!user) {
    throw new AppError(errorCodes.UNKNOWN_ERROR, "用户不存在", 404);
  }

  return user;
}

function getSearchWhere(search: string | null) {
  const query = search?.trim();

  if (!query) {
    return undefined;
  }

  return {
    OR: [
      { app_user_id: { contains: query } },
      { nickname: { contains: query } },
    ],
  };
}

export async function getGaokaoAdminOverview() {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [recentUsers, totalUsers, totalReports, unlimitedOverrides] =
    await Promise.all([
      prisma.appUser.count({ where: { last_seen_at: { gte: dayAgo } } }),
      prisma.appUser.count(),
      prisma.gaokaoReport.count(),
      prisma.gaokaoGenerationOverride.count({ where: { is_unlimited: true } }),
    ]);

  return {
    recentUsers,
    totalUsers,
    totalReports,
    unlimitedUsers: unlimitedOverrides + 2,
  };
}

async function buildGaokaoAdminUserRow(
  user: AppUserSummary,
): Promise<GaokaoAdminUserRow> {
  const [
    gaokaoReports,
    activeGaokaoReports,
    photoTasks,
    fortuneTasks,
    latestReport,
    generationStatus,
    override,
  ] = await Promise.all([
    prisma.gaokaoReport.count({ where: { user_id: user.id } }),
    prisma.gaokaoReport.count({
      where: { user_id: user.id, deleted_at: null },
    }),
    prisma.generationTask.count({ where: { user_id: user.id } }),
    prisma.fortuneGenerationTask.count({ where: { user_id: user.id } }),
    prisma.gaokaoReport.findFirst({
      where: { user_id: user.id },
      select: { created_at: true },
      orderBy: { created_at: "desc" },
    }),
    getGaokaoGenerationStatus(user.id),
    prisma.gaokaoGenerationOverride.findUnique({
      where: { user_id: user.id },
      select: { is_unlimited: true },
    }),
  ]);

  return {
    id: user.id,
    appUserId: user.app_user_id,
    nickname: user.nickname ?? "大宜宾用户",
    status: user.status,
    lastSeenAt: toIso(user.last_seen_at),
    createdAt: user.created_at.toISOString(),
    gaokaoReports,
    activeGaokaoReports,
    deletedGaokaoReports: Math.max(0, gaokaoReports - activeGaokaoReports),
    photoTasks,
    fortuneTasks,
    canGenerate: generationStatus.canGenerate,
    isUnlimited: isUnlimitedGaokaoUser({
      userId: user.id,
      appUserId: user.app_user_id,
      override,
    }),
    isBuiltInAdmin: isGaokaoAdminAppUserId(user.app_user_id),
    latestReportAt: toIso(latestReport?.created_at),
  };
}

export async function listGaokaoAdminUsers(input: {
  search?: string | null;
  take?: number;
} = {}): Promise<GaokaoAdminUserRow[]> {
  const users = await prisma.appUser.findMany({
    where: getSearchWhere(input.search ?? null),
    select: {
      id: true,
      app_user_id: true,
      nickname: true,
      status: true,
      created_at: true,
      last_seen_at: true,
    },
    orderBy: [{ last_seen_at: "desc" }, { created_at: "desc" }],
    take: input.take ?? 100,
  });

  return Promise.all(users.map(buildGaokaoAdminUserRow));
}

export async function getGaokaoAdminUserDetail(userId: string) {
  const user = await getTargetUser(userId);
  const row = await buildGaokaoAdminUserRow(user);
  const reports = await prisma.gaokaoReport.findMany({
    where: { user_id: user.id },
    select: {
      id: true,
      title: true,
      created_at: true,
      deleted_at: true,
    },
    orderBy: { created_at: "desc" },
    take: 20,
  });

  return {
    user: row,
    reports: reports.map((report) => ({
      id: report.id,
      title: report.title,
      createdAt: report.created_at.toISOString(),
      deletedAt: toIso(report.deleted_at),
    })),
  };
}

async function logGaokaoAdminAction(input: {
  admin: SessionUser;
  action: string;
  targetUserId: string;
  before: unknown;
  after: unknown;
  note?: string | null;
}) {
  const metadata = JSON.parse(
    JSON.stringify({
      adminAppUserId: input.admin.appUserId,
      adminNickname: input.admin.nickname,
      before: input.before,
      after: input.after,
      note: input.note ?? null,
    }),
  ) as Prisma.InputJsonObject;

  await prisma.adminAuditLog.create({
    data: {
      action: input.action,
      target_type: "gaokao_user",
      target_id: input.targetUserId,
      metadata,
    },
  });
}

export async function resetGaokaoUserGeneration(input: {
  admin: SessionUser;
  userId: string;
  note?: string | null;
}) {
  const before = await getGaokaoAdminUserDetail(input.userId);
  await prisma.gaokaoGenerationOverride.upsert({
    where: { user_id: input.userId },
    create: {
      user_id: input.userId,
      reset_at: new Date(),
      note: input.note ?? "管理员重置生成机会",
      updated_by_app_user_id: input.admin.appUserId,
    },
    update: {
      reset_at: new Date(),
      note: input.note ?? "管理员重置生成机会",
      updated_by_app_user_id: input.admin.appUserId,
    },
  });
  const after = await getGaokaoAdminUserDetail(input.userId);
  await logGaokaoAdminAction({
    admin: input.admin,
    action: "reset_generation_limit",
    targetUserId: input.userId,
    before,
    after,
    note: input.note,
  });

  return after;
}

export async function setGaokaoUserUnlimited(input: {
  admin: SessionUser;
  userId: string;
  isUnlimited: boolean;
  note?: string | null;
}) {
  const before = await getGaokaoAdminUserDetail(input.userId);
  await prisma.gaokaoGenerationOverride.upsert({
    where: { user_id: input.userId },
    create: {
      user_id: input.userId,
      is_unlimited: input.isUnlimited,
      note: input.note ?? null,
      updated_by_app_user_id: input.admin.appUserId,
    },
    update: {
      is_unlimited: input.isUnlimited,
      note: input.note ?? null,
      updated_by_app_user_id: input.admin.appUserId,
    },
  });
  const after = await getGaokaoAdminUserDetail(input.userId);
  await logGaokaoAdminAction({
    admin: input.admin,
    action: input.isUnlimited
      ? "enable_unlimited_generation"
      : "disable_unlimited_generation",
    targetUserId: input.userId,
    before,
    after,
    note: input.note,
  });

  return after;
}

export async function listGaokaoAdminAuditLogs() {
  const logs = await prisma.adminAuditLog.findMany({
    where: { target_type: "gaokao_user" },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    targetId: log.target_id,
    metadata: log.metadata,
    createdAt: log.created_at.toISOString(),
  }));
}
