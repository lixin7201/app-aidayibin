import { createHash, randomBytes } from "crypto";
import type { Prisma } from "@prisma/client";

import { getLifeTestResult, lifeTestResultList } from "@/features/life-test/config/results";
import {
  normalizeLifeTestAttribution,
  type LifeTestAttributionInput,
} from "@/features/life-test/life-test-attribution";
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
} & LifeTestAttributionInput & RequestMeta;

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
  campaign_id: string | null;
  entry_scene: string | null;
  channel: string | null;
  region_code: string | null;
  share_code: string | null;
  referrer_session_id: string | null;
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
    campaignId: session.campaign_id,
    entryScene: session.entry_scene,
    channel: session.channel,
    regionCode: session.region_code,
    shareCode: session.share_code,
    referrerSessionId: session.referrer_session_id,
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

function createShareCode() {
  return randomBytes(6).toString("base64url").replaceAll("_", "").slice(0, 8);
}

async function resolveReferrerSessionId(input: LifeTestAttributionInput) {
  if (input.referrerSessionId) {
    return input.referrerSessionId;
  }

  const shareCode = input.shareCode?.trim();

  if (!shareCode) {
    return null;
  }

  const referrer = await prisma.lifeTestSession.findFirst({
    where: { share_code: shareCode },
    select: { id: true },
  });

  return referrer?.id ?? null;
}

export async function createLifeTestSession(input: SessionCreateInput) {
  const attribution = normalizeLifeTestAttribution(input);
  const since = new Date(Date.now() - 10 * 60 * 1000);
  const repeatWhere = input.user
    ? { user_id: input.user.id, created_at: { gte: since } }
    : input.anonymousId
      ? { anonymous_id: input.anonymousId, created_at: { gte: since } }
      : null;
  const recentCount = repeatWhere
    ? await prisma.lifeTestSession.count({ where: repeatWhere })
    : 0;
  const referrerSessionId = await resolveReferrerSessionId(input);
  const session = await prisma.lifeTestSession.create({
    data: {
      user_id: input.user?.id ?? null,
      app_user_id: input.user?.appUserId ?? null,
      anonymous_id: input.anonymousId ?? null,
      nickname: input.user?.nickname ?? null,
      avatar_url: input.user?.avatarUrl ?? null,
      source: attribution.source,
      campaign: attribution.campaign,
      campaign_id: attribution.campaignId,
      entry_scene: attribution.entryScene,
      channel: attribution.channel,
      region_code: attribution.regionCode,
      share_code: createShareCode(),
      referrer_session_id: referrerSessionId,
      user_agent: input.userAgent ?? null,
      ip_hash: hashIp(input.ip),
      repeat_high: recentCount >= 5,
    },
  });

  await recordLifeTestEvent({
    user: input.user,
    sessionId: session.id,
    eventName: "start",
    source: attribution.source,
    campaign: attribution.campaign,
    campaignId: attribution.campaignId,
    entryScene: attribution.entryScene,
    channel: attribution.channel,
    regionCode: attribution.regionCode,
    shareCode: attribution.shareCode,
    referrerSessionId,
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
} & LifeTestAttributionInput) {
  const attribution = normalizeLifeTestAttribution(input);
  const event = await prisma.lifeTestEvent.create({
    data: {
      session_id: input.sessionId ?? null,
      user_id: input.user?.id ?? null,
      app_user_id: input.user?.appUserId ?? null,
      event_name: input.eventName,
      event_data: input.eventData === undefined ? undefined : toJson(input.eventData),
      source: attribution.source,
      campaign: attribution.campaign,
      campaign_id: attribution.campaignId,
      entry_scene: attribution.entryScene,
      channel: attribution.channel,
      region_code: attribution.regionCode,
      share_code: attribution.shareCode,
      referrer_session_id: attribution.referrerSessionId,
      poster_variant: attribution.posterVariant,
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
} & LifeTestAttributionInput) {
  const attribution = normalizeLifeTestAttribution(input);
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
      source: attribution.source,
      campaign: attribution.campaign,
      campaign_id: attribution.campaignId,
      entry_scene: attribution.entryScene,
      channel: attribution.channel,
      region_code: attribution.regionCode,
      share_code: attribution.shareCode,
      referrer_session_id: attribution.referrerSessionId,
    },
  });

  await recordLifeTestEvent({
    user: input.user,
    sessionId: input.sessionId,
    eventName: "lead_submit",
    eventData: { leadType: input.leadType },
    source: attribution.source,
    campaign: attribution.campaign,
    campaignId: attribution.campaignId,
    entryScene: attribution.entryScene,
    channel: attribution.channel,
    regionCode: attribution.regionCode,
    shareCode: attribution.shareCode,
    referrerSessionId: attribution.referrerSessionId,
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
      select: {
        created_at: true,
        status: true,
        result_code: true,
        region_code: true,
        channel: true,
        share_count: true,
        job_cta_clicks: true,
        match_cta_clicks: true,
        referrer_session_id: true,
      },
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
      select: {
        created_at: true,
        event_name: true,
        event_data: true,
        region_code: true,
        channel: true,
        share_code: true,
      },
    }),
    prisma.lifeTestLead.findMany({
      where: { created_at: { gte: sevenDayStart } },
      select: { created_at: true, region_code: true, channel: true },
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

  const regionStats = buildRegionStats(sevenDaySessions, sevenDayEvents);
  const channelStats = buildChannelStats(
    sevenDaySessions,
    sevenDayEvents,
    sevenDayLeads,
  );
  const resultPropagation = buildResultPropagationStats(
    sevenDaySessions,
    sevenDayEvents,
  );

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
    regionStats,
    channelStats,
    resultPropagation,
  };
}

type AdminSessionStatsRow = {
  status: string;
  result_code: string | null;
  region_code: string | null;
  channel: string | null;
  share_count: number;
  job_cta_clicks: number;
  match_cta_clicks: number;
  referrer_session_id: string | null;
};

type AdminEventStatsRow = {
  event_name: string;
  event_data: Prisma.JsonValue | null;
  region_code: string | null;
  channel: string | null;
};

type AdminLeadStatsRow = {
  region_code: string | null;
  channel: string | null;
};

function statKey(value: string | null | undefined) {
  return value || "未标记";
}

function rate(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function getEventResultCode(event: AdminEventStatsRow) {
  const data = event.event_data;

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const resultCode = (data as Record<string, unknown>).resultCode;
  return typeof resultCode === "string" ? resultCode : null;
}

function buildRegionStats(
  sessions: AdminSessionStatsRow[],
  events: AdminEventStatsRow[],
) {
  const rows = new Map<
    string,
    {
      region: string;
      starts: number;
      completes: number;
      shares: number;
      posterSaves: number;
      returnVisits: number;
    }
  >();
  const ensure = (regionCode: string | null) => {
    const key = statKey(regionCode);
    const existing = rows.get(key);

    if (existing) return existing;

    const next = {
      region: key,
      starts: 0,
      completes: 0,
      shares: 0,
      posterSaves: 0,
      returnVisits: 0,
    };
    rows.set(key, next);
    return next;
  };

  for (const session of sessions) {
    const row = ensure(session.region_code);
    row.starts += 1;
    if (session.status === "completed") row.completes += 1;
    if (session.referrer_session_id) row.returnVisits += 1;
  }

  for (const event of events) {
    const row = ensure(event.region_code);
    if (event.event_name === "share") row.shares += 1;
    if (event.event_name === "poster_save") row.posterSaves += 1;
  }

  return Array.from(rows.values())
    .map((row) => ({
      ...row,
      completionRate: rate(row.completes, row.starts),
    }))
    .sort(
      (left, right) =>
        right.starts - left.starts ||
        right.returnVisits - left.returnVisits ||
        left.region.localeCompare(right.region),
    )
    .slice(0, 12);
}

function buildChannelStats(
  sessions: AdminSessionStatsRow[],
  events: AdminEventStatsRow[],
  leads: AdminLeadStatsRow[],
) {
  const rows = new Map<
    string,
    {
      channel: string;
      views: number;
      starts: number;
      completes: number;
      shares: number;
      leads: number;
    }
  >();
  const ensure = (channel: string | null) => {
    const key = statKey(channel);
    const existing = rows.get(key);

    if (existing) return existing;

    const next = {
      channel: key,
      views: 0,
      starts: 0,
      completes: 0,
      shares: 0,
      leads: 0,
    };
    rows.set(key, next);
    return next;
  };

  for (const session of sessions) {
    const row = ensure(session.channel);
    row.starts += 1;
    if (session.status === "completed") row.completes += 1;
  }

  for (const event of events) {
    const row = ensure(event.channel);
    if (event.event_name === "view_home") row.views += 1;
    if (event.event_name === "share") row.shares += 1;
  }

  for (const lead of leads) {
    ensure(lead.channel).leads += 1;
  }

  return Array.from(rows.values())
    .sort(
      (left, right) =>
        right.starts - left.starts ||
        right.views - left.views ||
        left.channel.localeCompare(right.channel),
    )
    .slice(0, 12);
}

function buildResultPropagationStats(
  sessions: AdminSessionStatsRow[],
  events: AdminEventStatsRow[],
) {
  const rows = new Map<
    string,
    {
      resultCode: string;
      resultName: string;
      count: number;
      shares: number;
      posterSaves: number;
      jobClicks: number;
      matchmakerClicks: number;
    }
  >();
  const ensure = (resultCode: string) => {
    const existing = rows.get(resultCode);

    if (existing) return existing;

    const result = getLifeTestResult(resultCode as LifeTestResultCode);
    const next = {
      resultCode,
      resultName: result?.name ?? resultCode,
      count: 0,
      shares: 0,
      posterSaves: 0,
      jobClicks: 0,
      matchmakerClicks: 0,
    };
    rows.set(resultCode, next);
    return next;
  };

  for (const session of sessions) {
    if (!session.result_code || session.status !== "completed") continue;

    const row = ensure(session.result_code);
    row.count += 1;
    row.shares += session.share_count;
    row.jobClicks += session.job_cta_clicks;
    row.matchmakerClicks += session.match_cta_clicks;
  }

  for (const event of events) {
    const resultCode = getEventResultCode(event);
    if (!resultCode) continue;

    const row = ensure(resultCode);
    if (event.event_name === "poster_save") row.posterSaves += 1;
  }

  return Array.from(rows.values())
    .map((row) => ({
      ...row,
      shareRate: rate(row.shares, row.count),
      saveRate: rate(row.posterSaves, row.count),
      jobClickRate: rate(row.jobClicks, row.count),
      matchClickRate: rate(row.matchmakerClicks, row.count),
    }))
    .sort(
      (left, right) =>
        right.shares - left.shares ||
        right.posterSaves - left.posterSaves ||
        right.count - left.count,
    )
    .slice(0, 16);
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
      campaignId: session.campaign_id,
      entryScene: session.entry_scene,
      channel: session.channel,
      regionCode: session.region_code,
      shareCode: session.share_code,
      referrerSessionId: session.referrer_session_id,
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
    source: lead.source,
    campaign: lead.campaign,
    campaignId: lead.campaign_id,
    entryScene: lead.entry_scene,
    channel: lead.channel,
    regionCode: lead.region_code,
    shareCode: lead.share_code,
    referrerSessionId: lead.referrer_session_id,
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
      "campaign_id",
      "entry_scene",
      "channel",
      "region_code",
      "share_code",
      "referrer_session_id",
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
      session.campaignId ?? "",
      session.entryScene ?? "",
      session.channel ?? "",
      session.regionCode ?? "",
      session.shareCode ?? "",
      session.referrerSessionId ?? "",
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
      "source",
      "campaign",
      "campaign_id",
      "entry_scene",
      "channel",
      "region_code",
      "share_code",
      "referrer_session_id",
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
      lead.source ?? "",
      lead.campaign ?? "",
      lead.campaignId ?? "",
      lead.entryScene ?? "",
      lead.channel ?? "",
      lead.regionCode ?? "",
      lead.shareCode ?? "",
      lead.referrerSessionId ?? "",
      lead.note ?? "",
    ]),
  ];

  return toCsv(rows);
}
