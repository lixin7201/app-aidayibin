"use client";

import {
  ArrowLeft,
  BriefcaseBusiness,
  ChevronRight,
  Download,
  HeartHandshake,
  ListRestart,
  MapPinned,
  RotateCcw,
  Share2,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { SaveImageOverlay } from "@/components/save-image-overlay";
import { lifeTestCityConfig } from "@/features/life-test/config/city";
import {
  buildLifeTestQuestionFlow,
  getLifeTestEscapeState,
  isLifeTestMatchmakerSuppressed,
  lifeTestQuestionCount,
} from "@/features/life-test/config/questions";
import {
  getLifeTestResult,
  lifeTestResultList,
} from "@/features/life-test/config/results";
import {
  normalizeLifeTestAttribution,
  type LifeTestAttribution,
  type LifeTestAttributionInput,
} from "@/features/life-test/life-test-attribution";
import { scoreLifeTestAnswers } from "@/features/life-test/life-test-scoring";
import type {
  LifeTestAnswer,
  LifeTestQuestionBranch,
  LifeTestResultType,
  LifeTestScoreResult,
  LifeTestSessionPayload,
} from "@/features/life-test/types";
import { apiPath, appPath, assetPath } from "@/lib/routes";
import {
  saveImageToPhone,
  shareImage,
  type SaveImageState,
} from "@/lib/qfh5-actions";
import { createClientId } from "@/lib/utils/client-id";

type Mode = "home" | "play" | "result" | "types";

type CurrentUserProfile = {
  nickname: string;
  avatarUrl: string | null;
} | null;

type Props = {
  mode: Mode;
  sessionId?: string;
  currentUser: CurrentUserProfile;
};

type StoredSession = {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  campaignId: string | null;
  entryScene: string | null;
  channel: string | null;
  regionCode: string | null;
  shareCode: string | null;
  referrerSessionId: string | null;
  answers: LifeTestAnswer[];
  activeIndex: number;
  score: LifeTestScoreResult | null;
  resultCode: string | null;
  completedAt: string | null;
};

type LeadType = "job" | "matchmaker" | "both";

const activeStorageKey = "dayibin-life-test-active-v1";
const anonymousStorageKey = "dayibin-life-test-anonymous-v1";
const attributionStorageKey = "dayibin-life-test-attribution-v1";
const sessionStoragePrefix = "dayibin-life-test-session-v1:";
const heroImage = assetPath("/templates/yibin-night-cinematic.png");
const branchLabels: Record<LifeTestQuestionBranch, string> = {
  core: "核心筛查题",
  work: "打工班味线",
  job: "招聘换坑线",
  love: "红娘恋爱线",
  social: "社交电量线",
  recovery: "休息恢复线",
  antiRoutine: "反骨隐藏线",
  local: "本地浓度线",
  final: "命运暴击题",
};

function getStoredAnonymousId() {
  let id = window.localStorage.getItem(anonymousStorageKey);

  if (!id) {
    id = createClientId("life-test");
    window.localStorage.setItem(anonymousStorageKey, id);
  }

  return id;
}

function getSessionStorageKey(sessionId: string) {
  return `${sessionStoragePrefix}${sessionId}`;
}

function readStoredAttribution(): LifeTestAttributionInput {
  try {
    const raw = window.localStorage.getItem(attributionStorageKey);
    return raw ? (JSON.parse(raw) as LifeTestAttributionInput) : {};
  } catch {
    return {};
  }
}

function readUrlAttribution(): LifeTestAttributionInput {
  const params = new URL(window.location.href).searchParams;
  const value = (key: string) => params.get(key) ?? undefined;

  return {
    source: value("source"),
    campaign: value("campaign"),
    campaignId: value("campaign_id"),
    entryScene: value("entry_scene"),
    channel: value("channel"),
    regionCode: value("region_code"),
    shareCode: value("share_code"),
    referrerSessionId: value("referrer_session_id"),
    posterVariant: value("poster_variant"),
  };
}

function getCurrentAttribution() {
  const attribution = normalizeLifeTestAttribution({
    ...readStoredAttribution(),
    ...readUrlAttribution(),
  });
  window.localStorage.setItem(attributionStorageKey, JSON.stringify(attribution));
  return attribution;
}

function appendAttribution(
  path: string,
  attribution: LifeTestAttribution,
  extra?: LifeTestAttributionInput,
) {
  const next = new URL(appPath(path), window.location.origin);
  const merged = normalizeLifeTestAttribution({ ...attribution, ...extra });

  next.searchParams.set("campaign_id", merged.campaignId);
  next.searchParams.set("entry_scene", merged.entryScene);
  next.searchParams.set("channel", merged.channel);
  if (merged.regionCode) next.searchParams.set("region_code", merged.regionCode);
  if (merged.shareCode) next.searchParams.set("share_code", merged.shareCode);
  if (merged.referrerSessionId) {
    next.searchParams.set("referrer_session_id", merged.referrerSessionId);
  }

  return `${next.pathname}${next.search}`;
}

function readStoredSession(sessionId: string | null): StoredSession | null {
  if (!sessionId) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getSessionStorageKey(sessionId));
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session: StoredSession) {
  window.localStorage.setItem(activeStorageKey, session.id);
  window.localStorage.setItem(
    getSessionStorageKey(session.id),
    JSON.stringify(session),
  );
}

function isLocalSession(sessionId: string) {
  return sessionId.startsWith("local-");
}

async function postJson<T>(
  url: string,
  body: unknown,
  options?: { keepalive?: boolean },
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
    keepalive: options?.keepalive,
  });

  if (!response.ok) {
    throw new Error("request failed");
  }

  return (await response.json()) as T;
}

function buildLocalCompletedSession(
  session: StoredSession,
  answers: LifeTestAnswer[],
): StoredSession {
  const questions = buildLifeTestQuestionFlow(answers);
  const score = scoreLifeTestAnswers(answers, questions);

  return {
    ...session,
    answers,
    activeIndex: questions.length - 1,
    score,
    resultCode: score.resultCode,
    completedAt: new Date().toISOString(),
  };
}

function clampMetric(value: number) {
  return Math.min(99, Math.max(8, Math.round(value)));
}

function buildResultMetrics(score: LifeTestScoreResult) {
  const { scores } = score;

  return [
    {
      label: "工作安全感",
      value: clampMetric(
        42 + scores.careerStable * 5 + scores.decisionReal * 3 + scores.paceFast * 2,
      ),
    },
    {
      label: "关系节奏",
      value: clampMetric(
        28 + scores.loveOpen * 6 + scores.decisionFeel * 4 + scores.loveSlow * 2,
      ),
    },
    {
      label: "社交电量",
      value: clampMetric(
        70 + scores.loveOpen * 4 + scores.paceFast * 2 - scores.loveSlow * 3 - scores.paceSoft * 2,
      ),
    },
    {
      label: "行动方式",
      value: clampMetric(36 + scores.paceSoft * 6 + scores.decisionFeel * 3),
    },
  ];
}

export function LifeTestApp({ mode, sessionId, currentUser }: Props) {
  const [user, setUser] = useState(currentUser);
  const [activeSession, setActiveSession] = useState<StoredSession | null>(null);
  const [remoteSession, setRemoteSession] =
    useState<LifeTestSessionPayload | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<LifeTestAnswer[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveImageState | null>(null);
  const [leadType, setLeadType] = useState<LeadType | null>(null);
  const [leadNotice, setLeadNotice] = useState<string | null>(null);
  const [leadForm, setLeadForm] = useState({
    name: "",
    mobile: "",
    wechat: "",
    consent: false,
  });

  useEffect(() => {
    function handleAuthReady(event: Event) {
      const detail = (event as CustomEvent).detail as {
        nickname?: string;
        avatarUrl?: string | null;
      };
      setUser({
        nickname: detail.nickname ?? "大宜宾用户",
        avatarUrl: detail.avatarUrl ?? null,
      });
    }

    window.addEventListener("aidayibin:auth-ready", handleAuthReady);
    return () => window.removeEventListener("aidayibin:auth-ready", handleAuthReady);
  }, []);

  useEffect(() => {
    if (mode !== "home") {
      return;
    }

    const urlAttribution = readUrlAttribution();
    const attribution = getCurrentAttribution();
    void postJson(apiPath("/life-test/events"), {
      eventName: "view_home",
      ...attribution,
    }).catch(() => undefined);

    if (urlAttribution.shareCode) {
      void postJson(apiPath("/life-test/events"), {
        eventName: "share_landing",
        ...attribution,
      }).catch(() => undefined);
    }
  }, [mode]);

  useEffect(() => {
    if (!answerFeedback) {
      return;
    }

    const timer = window.setTimeout(() => setAnswerFeedback(null), 900);
    return () => window.clearTimeout(timer);
  }, [answerFeedback]);

  useEffect(() => {
    if (mode !== "play") {
      return;
    }

    const urlSessionId = new URL(window.location.href).searchParams.get("session");
    const stored =
      readStoredSession(urlSessionId) ??
      readStoredSession(window.localStorage.getItem(activeStorageKey));

    if (stored) {
      window.setTimeout(() => {
        setActiveSession(stored);
        setActiveIndex(stored.activeIndex);
        setAnswers(stored.answers);
      }, 0);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "result" || !sessionId) {
      return;
    }

    const urlAttribution = readUrlAttribution();
    const attribution = getCurrentAttribution();
    if (urlAttribution.shareCode) {
      void postJson(apiPath("/life-test/events"), {
        eventName: "share_landing",
        ...attribution,
      }).catch(() => undefined);
    }

    const stored = readStoredSession(sessionId);

    if (stored) {
      window.setTimeout(() => {
        setActiveSession(stored);
        setAnswers(stored.answers);
      }, 0);
    }

    if (!isLocalSession(sessionId)) {
      fetch(apiPath(`/life-test/sessions/${sessionId}`), {
        credentials: "include",
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((payload: { session?: LifeTestSessionPayload } | null) => {
          if (payload?.session) {
            setRemoteSession(payload.session);
          }
        })
        .catch(() => undefined);
    }
  }, [mode, sessionId]);

  const selectedMap = useMemo(
    () => new Map(answers.map((answer) => [answer.questionId, answer.optionId])),
    [answers],
  );
  const questionFlow = useMemo(() => buildLifeTestQuestionFlow(answers), [answers]);
  const currentQuestion = questionFlow[activeIndex];
  const resultSession = remoteSession ?? activeSession;
  const resultScore =
    remoteSession?.score ??
    activeSession?.score ??
    (answers.length === lifeTestQuestionCount
      ? scoreLifeTestAnswers(answers)
      : null);
  const result =
    remoteSession?.result ??
    (resultScore ? getLifeTestResult(resultScore.resultCode) : null);
  const resultMetrics = resultScore ? buildResultMetrics(resultScore) : [];
  const hiddenTag = resultScore?.hiddenTag ?? null;
  const matchmakerSuppressed = isLifeTestMatchmakerSuppressed(
    resultSession?.answers ?? answers,
  );
  const currentSessionId = remoteSession?.id ?? activeSession?.id ?? sessionId ?? "";
  const resultOwnerProfile: CurrentUserProfile = {
    nickname: resultSession?.nickname ?? user?.nickname ?? "大宜宾用户",
    avatarUrl: resultSession?.avatarUrl ?? user?.avatarUrl ?? null,
  };
  const posterUrl =
    result && currentSessionId && !isLocalSession(currentSessionId)
      ? appPath(`/life-test/poster/${currentSessionId}`)
      : result
        ? appPath(`/life-test/mock-poster/${result.code}`)
        : "";

  async function startTest() {
    setNotice(null);
    setAnswerFeedback(null);
    const attribution = getCurrentAttribution();
    const fallbackId = `local-${createClientId("life-test")}`;
    let nextSession: StoredSession = {
      id: fallbackId,
      nickname: user?.nickname ?? null,
      avatarUrl: user?.avatarUrl ?? null,
      campaignId: attribution.campaignId,
      entryScene: attribution.entryScene,
      channel: attribution.channel,
      regionCode: attribution.regionCode,
      shareCode: null,
      referrerSessionId: attribution.referrerSessionId,
      answers: [],
      activeIndex: 0,
      score: null,
      resultCode: null,
      completedAt: null,
    };

    try {
      const payload = await postJson<{ session: LifeTestSessionPayload }>(
        apiPath("/life-test/sessions"),
        {
          anonymousId: getStoredAnonymousId(),
          ...attribution,
        },
      );
      nextSession = {
        ...nextSession,
        id: payload.session.id,
        nickname: payload.session.nickname ?? user?.nickname ?? null,
        avatarUrl: payload.session.avatarUrl ?? user?.avatarUrl ?? null,
        campaignId: payload.session.campaignId,
        entryScene: payload.session.entryScene,
        channel: payload.session.channel,
        regionCode: payload.session.regionCode,
        shareCode: payload.session.shareCode,
        referrerSessionId: payload.session.referrerSessionId,
      };
    } catch {
      setNotice("本地先继续测试，数据记录稍后再补上。");
    }

    writeStoredSession(nextSession);
    window.location.assign(appPath(`/life-test/play?session=${nextSession.id}`));
  }

  function setAnswer(questionId: string, optionId: string) {
    if (!activeSession) {
      void startTest();
      return;
    }

    const currentFlowIndex = questionFlow.findIndex((item) => item.id === questionId);
    const nextAnswers = answers.filter((answer) => {
      const answerIndex = questionFlow.findIndex((item) => item.id === answer.questionId);
      return answerIndex >= 0 && answerIndex < currentFlowIndex;
    });
    nextAnswers.push({ questionId, optionId });
    const nextSession = {
      ...activeSession,
      answers: nextAnswers,
      activeIndex,
    };
    const nextEscapeState = getLifeTestEscapeState(nextAnswers);

    setNotice(null);
    setAnswerFeedback(
      nextEscapeState.hiddenPrompt
        ? "这几题已经看出来了：普通选项有点装不下你，后面换个问法。"
        : currentQuestion?.feedback ?? null,
    );
    setAnswers(nextAnswers);
    setActiveSession(nextSession);
    writeStoredSession(nextSession);

    if (!isLocalSession(activeSession.id)) {
      void postJson(apiPath(`/life-test/sessions/${activeSession.id}/answer`), {
        questionId,
        optionId,
      }).catch(() => undefined);
    }
  }

  function goNext() {
    if (!currentQuestion || !selectedMap.get(currentQuestion.id)) {
      setNotice("先选一个最像你的答案。");
      return;
    }

    setNotice(null);
    setAnswerFeedback(null);

    if (activeIndex < questionFlow.length - 1) {
      const nextIndex = activeIndex + 1;
      setActiveIndex(nextIndex);

      if (activeSession) {
        writeStoredSession({ ...activeSession, answers, activeIndex: nextIndex });
      }
      return;
    }

    void completeTest();
  }

  function goPrevious() {
    const nextIndex = Math.max(0, activeIndex - 1);
    setAnswerFeedback(null);
    setActiveIndex(nextIndex);

    if (activeSession) {
      writeStoredSession({ ...activeSession, answers, activeIndex: nextIndex });
    }
  }

  async function completeTest() {
    if (!activeSession) {
      return;
    }

    try {
      const completed = buildLocalCompletedSession(activeSession, answers);
      setActiveSession(completed);
      writeStoredSession(completed);

      if (!isLocalSession(activeSession.id)) {
        await postJson(apiPath(`/life-test/sessions/${activeSession.id}/complete`), {
          answers,
        }).catch(() => undefined);
      }

      window.location.assign(appPath(`/life-test/result/${activeSession.id}`));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "请完成全部题目后再看结果。");
    }
  }

  async function recordEvent(
    eventName: string,
    eventData?: unknown,
    options?: { keepalive?: boolean },
  ) {
    if (!currentSessionId || isLocalSession(currentSessionId)) {
      return;
    }

    const attribution = normalizeLifeTestAttribution({
      ...getCurrentAttribution(),
      campaignId: resultSession?.campaignId,
      entryScene: resultSession?.entryScene,
      channel: resultSession?.channel,
      regionCode: resultSession?.regionCode,
      shareCode: resultSession?.shareCode,
      referrerSessionId: resultSession?.referrerSessionId,
    });

    await postJson(apiPath("/life-test/events"), {
      sessionId: currentSessionId,
      eventName,
      eventData,
      ...attribution,
    }, options).catch(() => undefined);
  }

  async function handleSavePoster() {
    if (!posterUrl) {
      return;
    }

    await recordEvent("poster_save", {
      resultCode: result?.code,
      posterVariant: "base",
    });
    await saveImageToPhone({
      url: posterUrl,
      previewUrl: posterUrl,
      onStateChange: setSaveState,
    });
  }

  async function handleShare(resultType: LifeTestResultType) {
    const attribution = normalizeLifeTestAttribution({
      ...getCurrentAttribution(),
      campaignId: resultSession?.campaignId,
      channel: resultSession?.channel,
      regionCode: resultSession?.regionCode,
      shareCode: resultSession?.shareCode,
      referrerSessionId: currentSessionId,
      entryScene: "share_landing",
    });
    const pageUrl = appendAttribution(
      `/life-test/result/${currentSessionId}`,
      attribution,
    );

    await recordEvent("share", {
      resultCode: resultType.code,
      shareCode: attribution.shareCode,
      posterVariant: "base",
    });
    await shareImage({
      title: resultType.shareText,
      description: lifeTestCityConfig.defaultShareDescription,
      imageUrl: posterUrl,
      pageUrl,
    });
    setNotice("已调起分享；如果当前浏览器不支持，链接会复制好。");
  }

  async function submitLead() {
    if (!leadType) {
      return;
    }

    setLeadNotice(null);

    try {
      const attribution = normalizeLifeTestAttribution({
        ...getCurrentAttribution(),
        campaignId: resultSession?.campaignId,
        entryScene: resultSession?.entryScene,
        channel: resultSession?.channel,
        regionCode: resultSession?.regionCode,
        shareCode: resultSession?.shareCode,
        referrerSessionId: resultSession?.referrerSessionId,
      });

      await postJson(apiPath("/life-test/leads"), {
        sessionId: currentSessionId && !isLocalSession(currentSessionId)
          ? currentSessionId
          : undefined,
        leadType,
        ...leadForm,
        ...attribution,
      });
      setLeadNotice("已提交，大宜宾工作人员后续会联系你。");
      setLeadForm({ name: "", mobile: "", wechat: "", consent: false });
    } catch {
      setLeadNotice("请至少填写手机号或微信号，并勾选同意联系。");
    }
  }

  if (mode === "types") {
    return <TypesView />;
  }

  if (mode === "play") {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_50%_-10%,rgba(36,214,180,0.28),transparent_36%),radial-gradient(circle_at_10%_18%,rgba(255,91,60,0.16),transparent_28%),linear-gradient(145deg,#061312_0%,#0a1919_46%,#091013_100%)] text-[#F4FFFB]">
        <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden border-x border-white/10 bg-[#071514] px-4 py-4 shadow-2xl">
          <header className="flex min-h-10 items-center justify-between text-xs tracking-[0.08em] text-white/80">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-white/15 bg-white/7 text-[#F4FFFB] backdrop-blur"
              onClick={() => {
                window.location.assign(appPath("/life-test"));
              }}
              aria-label="返回首页"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="text-center">
              <p className="text-[11px] font-black text-[#24D6B4]">
                {currentQuestion ? branchLabels[currentQuestion.branch] : "宜宾精神状态质检"}
              </p>
              <p className="mt-1 text-[11px] font-bold text-[#A2BBB4]">
                第 {activeIndex + 1} / {questionFlow.length} 题
              </p>
            </div>
            <div className="pr-6">
              <LifeTestUserAvatar user={user} dark />
            </div>
          </header>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {["班味", "恋爱脑", "社交", "江边"].map((label, index) => (
              <div key={label} className="min-w-0 text-[10px] font-bold text-[#A2BBB4]">
                <span>{label}</span>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#24D6B4] to-[#6DB7FF]"
                    style={{
                      width: `${Math.max(
                        10,
                        Math.min(100, ((activeIndex + 1 + index) / questionFlow.length) * 86),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF5B3C] via-[#F6D06C] to-[#24D6B4] transition-all"
              style={{
                width: `${((activeIndex + 1) / questionFlow.length) * 100}%`,
              }}
            />
          </div>

          {currentQuestion ? (
            <section className="mt-5 flex flex-1 flex-col gap-4">
              <article className="relative overflow-hidden rounded-[8px] border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03)),rgba(13,31,30,0.86)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap gap-1.5 opacity-35">
                  {["先吃饭", "少点临时安排", "消息太多", "今天不解释"].map((item) => (
                    <span
                      key={item}
                      className="rounded-[8px] border border-white/12 bg-white/5 px-2 py-1 text-[10px] text-white/85"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <p className="pt-13 text-xs font-black tracking-[0.08em] text-[#F6D06C]">
                  Q{String(activeIndex + 1).padStart(2, "0")}
                </p>
                <h1 className="mt-2 text-[27px] font-black leading-[1.18] tracking-normal text-balance text-[#F4FFFB]">
                  {currentQuestion.title}
                </h1>
              </article>

              <div className="grid gap-2.5">
                {currentQuestion.options.map((option) => {
                  const selected = selectedMap.get(currentQuestion.id) === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`grid min-h-[62px] grid-cols-[32px_1fr] items-center gap-3 rounded-[8px] border px-3 py-3 text-left transition ${
                        selected
                          ? "border-[#24D6B4]/80 bg-[#24D6B4]/15 text-[#F4FFFB]"
                          : "border-white/15 bg-white/7 text-[#F4FFFB]"
                      }`}
                      onClick={() => setAnswer(currentQuestion.id, option.id)}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-sm font-black ${
                          selected ? "bg-[#24D6B4] text-[#06211E]" : "bg-white/10 text-[#F6D06C]"
                        }`}
                      >
                        {option.label}
                      </span>
                      <span className="min-w-0 text-[15px] font-bold leading-6">
                        {option.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {notice && (
                <p className="rounded-[8px] border border-[#F6D06C]/30 bg-[#F6D06C]/12 px-3 py-2 text-sm font-bold text-[#FFE1A3]">
                  {notice}
                </p>
              )}
              {answerFeedback && (
                <p className="rounded-[8px] border border-[#FF5B3C]/35 bg-[linear-gradient(135deg,rgba(255,91,60,0.13),rgba(36,214,180,0.08)),rgba(12,28,27,0.88)] px-3 py-3 text-sm font-black leading-6 text-[#D6EBE4]">
                  {answerFeedback}
                </p>
              )}

              <div className="mt-auto grid grid-cols-[1fr_1.4fr] gap-3 pt-4">
                <button
                  type="button"
                  className="flex h-12 items-center justify-center gap-2 rounded-[8px] border border-white/15 bg-white/7 text-sm font-black text-[#F4FFFB] disabled:opacity-40"
                  onClick={goPrevious}
                  disabled={activeIndex === 0}
                >
                  <ArrowLeft size={16} />
                  上一题
                </button>
                <button
                  type="button"
                  className="flex h-12 items-center justify-center gap-2 rounded-[8px] bg-gradient-to-r from-[#24D6B4] to-[#9DF3DF] text-sm font-black text-[#06211E] shadow-[0_14px_34px_rgba(36,214,180,0.22)]"
                  onClick={goNext}
                >
                  {activeIndex === questionFlow.length - 1 ? "生成报告" : "下一题"}
                  <ChevronRight size={16} />
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    );
  }

  if (mode === "result") {
    return (
      <main className="min-h-screen bg-[#F7F3EA] text-[#173B36]">
        <div className="mx-auto w-full max-w-[560px] px-4 py-5">
          {result && resultScore ? (
            <>
              <header className="flex items-center justify-between">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-white"
                  onClick={() => {
                    window.location.assign(appPath("/life-test"));
                  }}
                  aria-label="返回首页"
                >
                  <ArrowLeft size={18} />
                </button>
                <p className="text-sm font-black text-[#0F766E]">
                  {resultOwnerProfile.nickname} 的结果
                </p>
                <div className="pr-6">
                  <LifeTestUserAvatar user={resultOwnerProfile} />
                </div>
              </header>

              <section className="mt-5 overflow-hidden rounded-[8px] bg-[#123F39] p-3">
                <Image
                  src={posterUrl}
                  alt={`${result.name}结果海报`}
                  width={1024}
                  height={1536}
                  unoptimized
                  className="aspect-[2/3] w-full rounded-[8px] object-cover"
                />
              </section>

              <section className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex h-12 items-center justify-center gap-2 rounded-[8px] bg-[#0F766E] text-sm font-black text-white"
                  onClick={() => void handleSavePoster()}
                >
                  <Download size={16} />
                  保存图片
                </button>
                <button
                  type="button"
                  className="flex h-12 items-center justify-center gap-2 rounded-[8px] bg-[#173B36] text-sm font-black text-white"
                  onClick={() => void handleShare(result)}
                >
                  <Share2 size={16} />
                  分享结果
                </button>
              </section>

              <section className="mt-6">
                <p className="text-sm font-black text-[#B7791F]">{result.citySymbol}</p>
                <h1 className="mt-2 text-4xl font-black leading-tight">{result.name}</h1>
                <p className="mt-3 text-lg font-bold leading-8 text-[#355A54]">
                  {result.slogan}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-[#E2F4EC] px-3 py-1 text-xs font-black text-[#0F766E]"
                    >
                      {keyword}
                    </span>
                  ))}
                  {hiddenTag && (
                    <span className="rounded-full bg-[#173B36] px-3 py-1 text-xs font-black text-[#FFE1A3]">
                      {hiddenTag}
                    </span>
                  )}
                </div>
              </section>

              <section className="mt-5 grid grid-cols-2 gap-3">
                {resultMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-[8px] bg-white p-3">
                    <p className="text-xs font-black text-[#6E766F]">{metric.label}</p>
                    <div className="mt-2 flex items-end gap-1">
                      <span className="text-3xl font-black text-[#0F766E]">
                        {metric.value}
                      </span>
                      <span className="pb-1 text-xs font-black text-[#B7791F]">%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EDE4D6]">
                      <div
                        className="h-full rounded-full bg-[#0F766E]"
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </section>

              <section className="mt-5 grid gap-3">
                <AdviceBlock
                  icon={<Sparkles size={18} />}
                  title={result.analysisTitle}
                  body={result.analysisBody}
                />
                <AdviceBlock
                  icon={<HeartHandshake size={18} />}
                  title="你的舒服区"
                  body={result.comfortZone}
                />
                <AdviceBlock
                  icon={<BriefcaseBusiness size={18} />}
                  title="你的卡点"
                  body={result.blindSpot}
                />
                <AdviceBlock
                  icon={<MapPinned size={18} />}
                  title="今天给你一句建议"
                  body={result.todayAdvice}
                />
              </section>

              <section className="mt-3 grid gap-3">
                <ActionLink
                  icon={<BriefcaseBusiness size={18} />}
                  label={result.jobCtaText}
                  href={result.jobCtaUrl}
                  onClick={() =>
                    void recordEvent(
                      "job_cta_click",
                      { resultCode: result.code },
                      { keepalive: true },
                    )
                  }
                />
                {!matchmakerSuppressed && (
                  <ActionLink
                    icon={<HeartHandshake size={18} />}
                    label={result.matchCtaText}
                    href={result.matchCtaUrl}
                    onClick={() =>
                      void recordEvent(
                        "matchmaker_cta_click",
                        { resultCode: result.code },
                        { keepalive: true },
                      )
                    }
                  />
                )}
              </section>

              <section className={`mt-3 grid gap-3 ${matchmakerSuppressed ? "" : "grid-cols-2"}`}>
                <button
                  type="button"
                  className="flex h-12 items-center justify-center gap-2 rounded-[8px] bg-white text-sm font-black"
                  onClick={() => setLeadType("job")}
                >
                  <UserRound size={16} />
                  岗位推荐
                </button>
                {!matchmakerSuppressed && (
                  <button
                    type="button"
                    className="flex h-12 items-center justify-center gap-2 rounded-[8px] bg-white text-sm font-black"
                    onClick={() => setLeadType("matchmaker")}
                  >
                    <HeartHandshake size={16} />
                    红娘帮看
                  </button>
                )}
              </section>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[8px] bg-white text-sm font-black"
                  onClick={() => {
                    window.localStorage.removeItem(activeStorageKey);
                    window.location.assign(appPath("/life-test"));
                  }}
                >
                  <RotateCcw size={16} />
                  再测一次
                </button>
                <button
                  type="button"
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[8px] bg-white text-sm font-black"
                  onClick={() => {
                    window.location.assign(appPath("/life-test/types"));
                  }}
                >
                  <ListRestart size={16} />
                  全部类型
                </button>
              </div>
            </>
          ) : (
            <EmptyResult />
          )}
          {notice && (
            <p className="mt-4 rounded-[8px] bg-[#FFF2D7] px-3 py-2 text-sm font-bold text-[#8A5A12]">
              {notice}
            </p>
          )}
        </div>
        <LeadDialog
          leadType={leadType}
          leadForm={leadForm}
          leadNotice={leadNotice}
          onClose={() => {
            setLeadType(null);
            setLeadNotice(null);
          }}
          onChange={setLeadForm}
          onSubmit={() => void submitLead()}
        />
        <SaveImageOverlay
          state={saveState}
          onClose={() => setSaveState(null)}
          onRetry={() => void handleSavePoster()}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F3EA] text-[#173B36]">
      <section
        className="relative min-h-[72vh] overflow-hidden px-4 py-6 text-white"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(4,31,28,.25), rgba(4,31,28,.76)), url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto flex min-h-[calc(72vh-48px)] w-full max-w-[560px] flex-col justify-between">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFE1A3]">
                大宜宾 AI Studio
              </p>
              <p className="mt-1 text-sm font-bold text-white/82">
                {user?.nickname ? `${user.nickname}，来测一下` : "宜宾人专属测试"}
              </p>
            </div>
              <div className="flex items-center gap-2 pr-6">
              <a
                href={appPath("/life-test/types")}
                className="flex h-10 items-center gap-1 rounded-[8px] bg-white/16 px-3 text-xs font-black backdrop-blur"
              >
                全部结果
                <ChevronRight size={14} />
              </a>
              <LifeTestUserAvatar user={user} dark />
            </div>
          </header>

          <div className="pb-7">
            <h1 className="max-w-[460px] text-5xl font-black leading-[1.04]">
              宜宾精神状态测试
            </h1>
            <p className="mt-4 max-w-[420px] text-lg font-bold leading-8 text-white/88">
              3 分钟测你最近的工作、关系、社交和行动状态。
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="flex h-13 items-center justify-center gap-2 rounded-[8px] bg-[#FFE1A3] px-5 text-base font-black text-[#173B36]"
                onClick={() => void startTest()}
              >
                开始测试
                <Sparkles size={18} />
              </button>
              <a
                href={appPath("/life-test/types")}
                className="flex h-13 items-center justify-center gap-2 rounded-[8px] bg-white/14 px-5 text-base font-black text-white backdrop-blur"
              >
                先看有哪些结果
                <ChevronRight size={18} />
              </a>
            </div>
            {notice && (
              <p className="mt-4 rounded-[8px] bg-white/18 px-3 py-2 text-sm font-bold text-white">
                {notice}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[560px] px-4 py-6">
        <div className="grid grid-cols-3 gap-3">
          <TinyStat value="69" label="题库动态抽题" />
          <TinyStat value="16" label="种精神状态" />
          <TinyStat value="1min" label="大概完成" />
        </div>
        <div className="mt-5 rounded-[8px] bg-white p-4">
          <p className="text-sm font-black text-[#0F766E]">仅供娱乐</p>
          <p className="mt-2 text-sm font-bold leading-6 text-[#5E6D66]">
            {lifeTestCityConfig.disclaimer}
          </p>
        </div>
      </section>
    </main>
  );
}

function TinyStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[8px] bg-white p-3 text-center">
      <p className="text-2xl font-black text-[#0F766E]">{value}</p>
      <p className="mt-1 text-xs font-bold text-[#6E766F]">{label}</p>
    </div>
  );
}

function LifeTestUserAvatar({
  user,
  dark = false,
}: {
  user: CurrentUserProfile;
  dark?: boolean;
}) {
  const nickname = user?.nickname || "大宜宾用户";
  const fallbackText = nickname.trim().slice(0, 1) || "大";

  return (
    <div
      className={`inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border shadow-sm ${
        dark
          ? "border-white/20 bg-white/10 text-[#F6D06C]"
          : "border-white bg-white text-[#0F766E]"
      }`}
      title={nickname}
      aria-label={nickname}
    >
      {user?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatarUrl}
          alt={nickname}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-sm font-black">{fallbackText}</span>
      )}
    </div>
  );
}

function AdviceBlock({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[8px] bg-white p-4">
      <div className="flex items-center gap-2 text-[#0F766E]">
        {icon}
        <h2 className="text-sm font-black">{title}</h2>
      </div>
      <p className="mt-2 text-sm font-bold leading-6 text-[#4D5F58]">{body}</p>
    </div>
  );
}

function ActionLink({
  icon,
  label,
  href,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  onClick: () => void;
}) {
  return (
    <a
      href={href}
      className="flex min-h-13 items-center justify-between gap-3 rounded-[8px] bg-[#173B36] px-4 py-3 text-sm font-black text-white"
      onClick={onClick}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <ChevronRight size={16} />
    </a>
  );
}

function TypesView() {
  return (
    <main className="min-h-screen bg-[#F7F3EA] text-[#173B36]">
      <div className="mx-auto w-full max-w-[720px] px-4 py-5">
        <header className="flex items-center justify-between">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-white"
            onClick={() => {
              window.location.assign(appPath("/life-test"));
            }}
            aria-label="返回首页"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="text-right">
            <p className="text-xs font-black text-[#0F766E]">16 种结果类型</p>
            <h1 className="text-xl font-black">宜宾精神状态图鉴</h1>
          </div>
        </header>
        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          {lifeTestResultList.map((item) => (
            <article key={item.code} className="rounded-[8px] bg-white p-4">
              <div className="flex gap-3">
                <Image
                  src={appPath(`/life-test/mock-poster/${item.code}`)}
                  alt={`${item.name}海报缩略图`}
                  width={128}
                  height={192}
                  unoptimized
                  className="h-24 w-16 rounded-[8px] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black text-[#B7791F]">
                    {item.citySymbol}
                  </p>
                  <h2 className="mt-1 text-base font-black">{item.name}</h2>
                  <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-[#5E6D66]">
                    {item.slogan}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full bg-[#E2F4EC] px-2 py-1 text-[11px] font-black text-[#0F766E]"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function EmptyResult() {
  return (
    <section className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#0F766E]">
        <Sparkles size={24} />
      </div>
      <h1 className="mt-4 text-2xl font-black">还没有找到结果</h1>
      <p className="mt-2 text-sm font-bold leading-6 text-[#5E6D66]">
        先完成 13 道动态题，再生成你的宜宾精神状态报告。
      </p>
      <a
        href={appPath("/life-test")}
        className="mt-5 flex h-12 items-center justify-center rounded-[8px] bg-[#0F766E] px-5 text-sm font-black text-white"
      >
        去开始测试
      </a>
    </section>
  );
}

function LeadDialog({
  leadType,
  leadForm,
  leadNotice,
  onClose,
  onChange,
  onSubmit,
}: {
  leadType: LeadType | null;
  leadForm: { name: string; mobile: string; wechat: string; consent: boolean };
  leadNotice: string | null;
  onClose: () => void;
  onChange: (value: {
    name: string;
    mobile: string;
    wechat: string;
    consent: boolean;
  }) => void;
  onSubmit: () => void;
}) {
  if (!leadType) {
    return null;
  }

  const title = leadType === "job" ? "需要岗位推荐吗" : "需要红娘老师帮你看看吗";

  return (
    <div className="fixed inset-0 z-[2147483645] flex items-end bg-black/50 p-4 sm:items-center sm:justify-center">
      <section className="w-full rounded-[8px] bg-white p-4 text-[#173B36] sm:max-w-[420px]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">{title}</h2>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#F7F3EA]"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          <input
            className="h-11 rounded-[8px] border border-[#E0D8C9] px-3 text-sm font-bold outline-none focus:border-[#0F766E]"
            placeholder="称呼（选填）"
            value={leadForm.name}
            onChange={(event) => onChange({ ...leadForm, name: event.target.value })}
          />
          <input
            className="h-11 rounded-[8px] border border-[#E0D8C9] px-3 text-sm font-bold outline-none focus:border-[#0F766E]"
            placeholder="手机号（手机号/微信号至少填一个）"
            value={leadForm.mobile}
            onChange={(event) => onChange({ ...leadForm, mobile: event.target.value })}
          />
          <input
            className="h-11 rounded-[8px] border border-[#E0D8C9] px-3 text-sm font-bold outline-none focus:border-[#0F766E]"
            placeholder="微信号"
            value={leadForm.wechat}
            onChange={(event) => onChange({ ...leadForm, wechat: event.target.value })}
          />
          <label className="flex items-start gap-2 text-xs font-bold leading-5 text-[#5E6D66]">
            <input
              type="checkbox"
              className="mt-1"
              checked={leadForm.consent}
              onChange={(event) =>
                onChange({ ...leadForm, consent: event.target.checked })
              }
            />
            我同意大宜宾工作人员联系我提供招聘/红娘相关服务。
          </label>
        </div>
        {leadNotice && (
          <p className="mt-3 rounded-[8px] bg-[#FFF2D7] px-3 py-2 text-sm font-bold text-[#8A5A12]">
            {leadNotice}
          </p>
        )}
        <button
          type="button"
          className="mt-4 flex h-11 w-full items-center justify-center rounded-[8px] bg-[#0F766E] text-sm font-black text-white"
          onClick={onSubmit}
        >
          提交
        </button>
      </section>
    </div>
  );
}
