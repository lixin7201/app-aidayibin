import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";

import { getLifeTestResult, lifeTestResultList } from "@/features/life-test/config/results";
import { scoreLifeTestAnswers } from "@/features/life-test/life-test-scoring";
import type { SessionUser } from "@/features/auth/session";
import type {
  LifeTestAnswer,
  LifeTestResultCode,
  LifeTestScoreResult,
  LifeTestSessionPayload,
} from "@/features/life-test/types";
import { prisma } from "@/lib/db/prisma";
import { AppError, errorCodes } from "@/lib/http/errors";

type RequestMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

type SessionCreateInput = {
  user: SessionUser | null;
  anonymousId?: string | null;
  source?: string | null;
  campaign?: string | null;
} & RequestMeta;

function toJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function hashIp(ip?: string | null) {
  if (!ip) {
    return null;
  }

  return createHash("sha256").update(ip).digest("hex");
}

function parseJsonArray<T>(value: Prisma.JsonValue | null | undefined): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function parseScore(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object"
    ? (value as unknown as LifeTestScoreResult)
    : null;
}

function toSessionPayload(session: {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  status: string;
  answers_json: Prisma.JsonValue | null;
  score_json: Prisma.JsonValue | null;
  result_code: string | null;
  created_at: Date;
  completed_at: Date | null;
  repeat_high: boolean;
  app_users?: { avatar_url: string | null } | null;
}): LifeTestSessionPayload {
  const result = session.result_code
    ? getLifeTestResult(session.result_code as LifeTestResultCode)
    : null;

  return {
    id: session.id,
    nickname: session.nickname,
    avatarUrl: session.avatar_url ?? session.app_users?.avatar_url ?? null,
    status: session.status,
    answers: parseJsonArray<LifeTestAnswer>(session.answers_json),
    score: parseScore(session.score_json),
    result,
    createdAt: session.created_at.toISOString(),
    completedAt: session.completed_at?.toISOString() ?? null,
    repeatHigh: session.repeat_high,
  };
}

function startOfLocalDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function escapeLifeTestCsvValue(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function toCsv(rows: unknown[][]) {
  return rows.map((row) => row.map(escapeLifeTestCsvValue).join(",")).join("\n");
}

export function validateLifeTestLeadContact(input: {
  mobile?: string | null;
  wechat?: string | null;
}) {
  const mobile = input.mobile?.trim() ?? "";
  const wechat = input.wechat?.trim() ?? "";

  if (!mobile && !wechat) {
    throw new AppError(errorCodes.INVALID_LIFE_TEST_ANSWERS, "手机号和微信号至少填写一个", 400);
  }

  if (mobile && !/^1[3-9]\d{9}$/.test(mobile)) {
    throw new AppError(errorCodes.INVALID_LIFE_TEST_ANSWERS, "手机号格式不正确", 400);
  }

  if (wechat && !/^[A-Za-z][-_A-Za-z0-9]{5,19}$/.test(wechat)) {
    throw new AppError(errorCodes.INVALID_LIFE_TEST_ANSWERS, "微信号格式不正确", 400);
  }

  return { mobile, wechat };
}

export async function createLifeTestSession(input: SessionCreateInput) {
  const since = new Date(Date.now() - 10 * 60 * 1000);
  const repeatWhere = input.user
    ? { user_id: input.user.id, created_at: { gte: since } }
    : input.anonymousId
      ? { anonymous_id: input.anonymousId, created_at: { gte: since } }
      : null;
  const recentCount = repeatWhere
    ? await prisma.lifeTestSession.count({ where: repeatWhere })
    : 0;
  const session = await prisma.lifeTestSession.create({
    data: {
      user_id: input.user?.id ?? null,
      app_user_id: input.user?.appUserId ?? null,
      anonymous_id: input.anonymousId ?? null,
      nickname: input.user?.nickname ?? null,
      avatar_url: input.user?.avatarUrl ?? null,
      source: input.source ?? null,
      campaign: input.campaign ?? null,
      user_agent: input.userAgent ?? null,
      ip_hash: hashIp(input.ip),
      repeat_high: recentCount >= 5,
    },
  });

  await recordLifeTestEvent({
    user: input.user,
    sessionId: session.id,
    eventName: "start",
    source: input.source,
    campaign: input.campaign,
  });

  return toSessionPayload(session);
}

export async function getLifeTestSession(sessionId: string) {
  const session = await prisma.lifeTestSession.findUnique({
    where: { id: sessionId },
    include: {
      app_users: {
        select: { avatar_url: true },
      },
    },
  });

  if (!session) {
    throw new AppError(errorCodes.UNKNOWN_ERROR, "测试记录不存在", 404);
  }

  return toSessionPayload(session);
}

export async function saveLifeTestAnswer(input: {
  sessionId: string;
  answer: LifeTestAnswer;
  user: SessionUser | null;
}) {
  const session = await prisma.lifeTestSession.findUnique({
    where: { id: input.sessionId },
    select: { answers_json: true },
  });

  if (!session) {
    throw new AppError(errorCodes.UNKNOWN_ERROR, "测试记录不存在", 404);
  }

  const answers = parseJsonArray<LifeTestAnswer>(session.answers_json).filter(
    (answer) => answer.questionId !== input.answer.questionId,
  );
  answers.push(input.answer);

  await prisma.lifeTestSession.update({
    where: { id: input.sessionId },
    data: { answers_json: toJson(answers) },
  });

  await recordLifeTestEvent({
    user: input.user,
    sessionId: input.sessionId,
    eventName: "answer",
    eventData: input.answer,
  });

  return { answers };
}

export async function completeLifeTestSession(input: {
  sessionId: string;
  answers: LifeTestAnswer[];
  user: SessionUser | null;
}) {
  let score: LifeTestScoreResult;

  try {
    score = scoreLifeTestAnswers(input.answers);
  } catch (error) {
    throw new AppError(
      errorCodes.INVALID_LIFE_TEST_ANSWERS,
      error instanceof Error ? error.message : "答案不完整",
      400,
    );
  }

  const session = await prisma.lifeTestSession.update({
    where: { id: input.sessionId },
    data: {
      status: "completed",
      answers_json: toJson(input.answers),
      score_json: toJson(score),
      result_code: score.resultCode,
      tie_broken: score.tieBroken,
      completed_at: new Date(),
    },
  });

  await recordLifeTestEvent({
    user: input.user,
    sessionId: input.sessionId,
    eventName: "complete",
    eventData: { resultCode: score.resultCode },
  });

  return toSessionPayload(session);
}

export async function recordLifeTestEvent(input: {
  user: SessionUser | null;
  sessionId?: string | null;
  eventName: string;
  eventData?: unknown;
  source?: string | null;
  campaign?: string | null;
}) {
  const event = await prisma.lifeTestEvent.create({
    data: {
      session_id: input.sessionId ?? null,
      user_id: input.user?.id ?? null,
      app_user_id: input.user?.appUserId ?? null,
      event_name: input.eventName,
      event_data: input.eventData === undefined ? undefined : toJson(input.eventData),
      source: input.source ?? null,
      campaign: input.campaign ?? null,
    },
  });

  if (input.sessionId && input.eventName === "share") {
    await prisma.lifeTestSession.update({
      where: { id: input.sessionId },
      data: { share_count: { increment: 1 } },
    });
  }

  if (input.sessionId && input.eventName === "job_cta_click") {
    await prisma.lifeTestSession.update({
      where: { id: input.sessionId },
      data: { job_cta_clicks: { increment: 1 } },
    });
  }

  if (input.sessionId && input.eventName === "matchmaker_cta_click") {
    await prisma.lifeTestSession.update({
      where: { id: input.sessionId },
      data: { match_cta_clicks: { increment: 1 } },
    });
  }

  return event;
}

export async function createLifeTestLead(input: {
  user: SessionUser | null;
  sessionId?: string | null;
  leadType: string;
  name?: string | null;
  mobile?: string | null;
  wechat?: string | null;
  note?: string | null;
  consent: boolean;
  source?: string | null;
  campaign?: string | null;
}) {
  const { mobile, wechat } = validateLifeTestLeadContact(input);

  if (!input.consent) {
    throw new AppError(errorCodes.INVALID_LIFE_TEST_ANSWERS, "请先勾选同意联系说明", 400);
  }

  const session = input.sessionId
    ? await prisma.lifeTestSession.findUnique({
        where: { id: input.sessionId },
        select: { result_code: true },
      })
    : null;

  const lead = await prisma.lifeTestLead.create({
    data: {
      session_id: input.sessionId ?? null,
      user_id: input.user?.id ?? null,
      app_user_id: input.user?.appUserId ?? null,
      result_code: session?.result_code ?? null,
      lead_type: input.leadType,
      name: input.name?.trim() || null,
      mobile: mobile || null,
      wechat: wechat || null,
      note: input.note?.trim() || null,
      consent: input.consent,
      source: input.source ?? null,
      campaign: input.campaign ?? null,
    },
  });

  await recordLifeTestEvent({
    user: input.user,
    sessionId: input.sessionId,
    eventName: "lead_submit",
    eventData: { leadType: input.leadType },
    source: input.source,
    campaign: input.campaign,
  });

  return lead;
}

export async function getLifeTestAdminStats() {
  const todayStart = startOfLocalDay(new Date());
  const sevenDayStart = addDays(todayStart, -6);
  const [
    todaySessions,
    todayCompleted,
    todayEvents,
    todayLeads,
    resultRows,
    sevenDaySessions,
    sevenDayEvents,
    sevenDayLeads,
  ] = await Promise.all([
    prisma.lifeTestSession.count({ where: { created_at: { gte: todayStart } } }),
    prisma.lifeTestSession.count({
      where: { status: "completed", created_at: { gte: todayStart } },
    }),
    prisma.lifeTestEvent.groupBy({
      by: ["event_name"],
      where: { created_at: { gte: todayStart } },
      _count: { _all: true },
    }),
    prisma.lifeTestLead.count({ where: { created_at: { gte: todayStart } } }),
    prisma.lifeTestSession.groupBy({
      by: ["result_code"],
      where: { status: "completed", result_code: { not: null } },
      _count: { _all: true },
    }),
    prisma.lifeTestSession.findMany({
      where: { created_at: { gte: sevenDayStart } },
      select: { created_at: true, status: true },
    }),
    prisma.lifeTestEvent.findMany({
      where: {
        created_at: { gte: sevenDayStart },
        event_name: {
          in: [
            "view_home",
            "share",
            "poster_save",
            "job_cta_click",
            "matchmaker_cta_click",
          ],
        },
      },
      select: { created_at: true, event_name: true },
    }),
    prisma.lifeTestLead.findMany({
      where: { created_at: { gte: sevenDayStart } },
      select: { created_at: true },
    }),
  ]);
  const eventCounts = Object.fromEntries(
    todayEvents.map((event) => [event.event_name, event._count._all]),
  );
  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(sevenDayStart, index);
    return {
      date: formatDayKey(date),
      views: 0,
      starts: 0,
      completes: 0,
      saves: 0,
      shares: 0,
      jobClicks: 0,
      matchmakerClicks: 0,
      leads: 0,
    };
  });
  const trendByDate = new Map(trend.map((item) => [item.date, item]));

  for (const session of sevenDaySessions) {
    const item = trendByDate.get(formatDayKey(session.created_at));
    if (!item) continue;
    item.starts += 1;
    if (session.status === "completed") {
      item.completes += 1;
    }
  }

  for (const event of sevenDayEvents) {
    const item = trendByDate.get(formatDayKey(event.created_at));
    if (!item) continue;

    if (event.event_name === "view_home") item.views += 1;
    if (event.event_name === "share") item.shares += 1;
    if (event.event_name === "poster_save") item.saves += 1;
    if (event.event_name === "job_cta_click") item.jobClicks += 1;
    if (event.event_name === "matchmaker_cta_click") item.matchmakerClicks += 1;
  }

  for (const lead of sevenDayLeads) {
    const item = trendByDate.get(formatDayKey(lead.created_at));
    if (item) {
      item.leads += 1;
    }
  }

  return {
    todayPv: eventCounts.view_home ?? 0,
    todaySessions,
    todayCompleted,
    completionRate:
      todaySessions > 0 ? Math.round((todayCompleted / todaySessions) * 100) : 0,
    todayShares: eventCounts.share ?? 0,
    todayPosterSaves: eventCounts.poster_save ?? 0,
    todayJobClicks: eventCounts.job_cta_click ?? 0,
    todayMatchmakerClicks: eventCounts.matchmaker_cta_click ?? 0,
    todayLeads,
    resultDistribution: resultRows.map((row) => ({
      resultCode: row.result_code,
      resultName: row.result_code
        ? getLifeTestResult(row.result_code as LifeTestResultCode).name
        : "未知",
      count: row._count._all,
    })),
    resultTypes: lifeTestResultList.map((item) => ({
      code: item.code,
      name: item.name,
      keywords: item.keywords,
    })),
    sevenDayTrend: trend,
  };
}

export async function listLifeTestAdminSessions() {
  const sessions = await prisma.lifeTestSession.findMany({
    orderBy: { created_at: "desc" },
    take: 100,
  });

  return sessions.map((session) => {
    const payload = toSessionPayload(session);

    return {
      ...payload,
      appUserId: session.app_user_id,
      source: session.source,
      campaign: session.campaign,
      shareCount: session.share_count,
      jobCtaClicks: session.job_cta_clicks,
      matchCtaClicks: session.match_cta_clicks,
      tieBroken: session.tie_broken,
    };
  });
}

export async function listLifeTestAdminLeads() {
  const leads = await prisma.lifeTestLead.findMany({
    orderBy: { created_at: "desc" },
    take: 100,
  });

  return leads.map((lead) => ({
    id: lead.id,
    sessionId: lead.session_id,
    appUserId: lead.app_user_id,
    resultCode: lead.result_code,
    resultName: lead.result_code
      ? getLifeTestResult(lead.result_code as LifeTestResultCode).name
      : null,
    leadType: lead.lead_type,
    name: lead.name,
    mobile: lead.mobile,
    wechat: lead.wechat,
    note: lead.note,
    createdAt: lead.created_at.toISOString(),
  }));
}

export async function exportLifeTestSessionsCsv() {
  const sessions = await listLifeTestAdminSessions();
  const rows = [
    [
      "id",
      "created_at",
      "completed_at",
      "app_user_id",
      "nickname",
      "status",
      "result_code",
      "result_name",
      "share_count",
      "job_cta_clicks",
      "match_cta_clicks",
      "tie_broken",
      "repeat_high",
      "source",
      "campaign",
    ],
    ...sessions.map((session) => [
      session.id,
      session.createdAt,
      session.completedAt ?? "",
      session.appUserId ?? "",
      session.nickname ?? "",
      session.status,
      session.result?.code ?? "",
      session.result?.name ?? "",
      session.shareCount,
      session.jobCtaClicks,
      session.matchCtaClicks,
      session.tieBroken ? "1" : "0",
      session.repeatHigh ? "1" : "0",
      session.source ?? "",
      session.campaign ?? "",
    ]),
  ];

  return toCsv(rows);
}

export async function exportLifeTestLeadsCsv() {
  const leads = await listLifeTestAdminLeads();
  const rows = [
    [
      "id",
      "created_at",
      "session_id",
      "app_user_id",
      "lead_type",
      "name",
      "mobile",
      "wechat",
      "result_code",
      "result_name",
      "note",
    ],
    ...leads.map((lead) => [
      lead.id,
      lead.createdAt,
      lead.sessionId ?? "",
      lead.appUserId ?? "",
      lead.leadType,
      lead.name ?? "",
      lead.mobile ?? "",
      lead.wechat ?? "",
      lead.resultCode ?? "",
      lead.resultName ?? "",
      lead.note ?? "",
    ]),
  ];

  return toCsv(rows);
}
