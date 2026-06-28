"use client";

import {
  AlertTriangle,
  BookOpenCheck,
  ChevronRight,
  Eye,
  History,
  Loader2,
  RefreshCcw,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { GaokaoReportView } from "@/features/gaokao/gaokao-report-view";
import type {
  GaokaoDataStatus,
  GaokaoFirstChoiceSubject,
  GaokaoGenerationStatus,
  GaokaoOptionalSubject,
  GaokaoProfile,
  GaokaoReportListItem,
} from "@/features/gaokao/types";
import {
  createEmptyGaokaoProfile,
  getRiskPreferenceLabel,
} from "@/features/gaokao/types";
import { shareImage } from "@/lib/qfh5-actions";
import { apiPath, assetPath } from "@/lib/routes";

type CurrentUserProfile = {
  nickname: string;
  avatarUrl: string | null;
};

type Props = {
  currentUser: CurrentUserProfile | null;
  initialReports: GaokaoReportListItem[];
  initialDataStatus: GaokaoDataStatus;
  initialGenerationStatus: GaokaoGenerationStatus;
};

type ChatItem = {
  role: "assistant" | "user";
  content: string;
};

const initialAssistantMessage =
  "先确认基本信息，再补一句偏好；确认没问题后点开始智能分析。";
const heroImageUrl = assetPath("/static/gaokao/gaokao-hero-20260628.jpg");
const optionalSubjectOptions: GaokaoOptionalSubject[] = [
  "化学",
  "生物",
  "思想政治",
  "地理",
];
const featureCards = [
  {
    title: "AI 初筛",
    desc: "按分数生成冲稳保建议",
    imageUrl: assetPath("/static/gaokao/feature-ai-screening-20260628.jpg"),
    tone: "blue",
  },
  {
    title: "院校推荐",
    desc: "结合四川近年投档数据推荐",
    imageUrl: assetPath("/static/gaokao/feature-school-recommend-20260628.jpg"),
    tone: "green",
  },
  {
    title: "志愿报告",
    desc: "输出可分享的填报建议",
    imageUrl: assetPath("/static/gaokao/feature-report-20260628.jpg"),
    tone: "purple",
  },
] as const;

function subjectTypeFromFirstChoice(
  subject: GaokaoFirstChoiceSubject,
): "物理类" | "历史类" {
  return subject === "物理" ? "物理类" : "历史类";
}

function formatSubjectSelection(profile: GaokaoProfile) {
  const subjects = [
    profile.firstChoiceSubject,
    ...profile.optionalSubjects,
  ].filter(
    (subject): subject is GaokaoFirstChoiceSubject | GaokaoOptionalSubject =>
      Boolean(subject),
  );

  return subjects.join(" + ") || profile.subjectType || "";
}

function formatProfile(profile: GaokaoProfile) {
  return [
    profile.studentName,
    formatSubjectSelection(profile),
    profile.score ? `${profile.score}分` : null,
    profile.preferredMajors.length > 0
      ? `想看 ${profile.preferredMajors.join("、")}`
      : null,
    profile.preferredCities.length > 0
      ? `城市 ${profile.preferredCities.join("、")}`
      : null,
    formatProfileLocation(profile),
    profile.acceptPrivate === false ? "不读民办" : null,
    profile.acceptSinoForeign === false ? "不读中外" : null,
    profile.acceptAdjustment === true ? "可调剂" : null,
    `策略 ${getRiskPreferenceLabel(profile.riskPreference)}`,
  ]
    .filter(Boolean)
    .join(" / ");
}

function formatProfileLocation(profile: GaokaoProfile) {
  const preferred = [
    ...profile.preferredRegions.map((region) => `${region}优先`),
    ...profile.preferredSchoolProvinces,
    ...profile.preferredSchoolCities,
  ];
  const rejected = [
    ...profile.rejectedRegions,
    ...profile.rejectedSchoolProvinces.map((province) => `${province}省内`),
    ...profile.rejectedSchoolCities,
  ];

  if (rejected.length > 0) {
    return `排除 ${rejected.join("、")}`;
  }

  if (preferred.length > 0) {
    return `地域 ${preferred.join("、")}`;
  }

  if (profile.distancePreference === "province_outside") {
    return "省外优先";
  }

  if (profile.distancePreference === "far_from_home") {
    return "离家远";
  }

  return null;
}

function buildAdvisorConfirmItems(profile: GaokaoProfile) {
  const items = [
    profile.subjectType
      ? `硬信息：四川${profile.subjectType}${profile.score ? `，${profile.score} 分` : ""}${profile.rank ? `，位次 ${profile.rank}` : ""}`
      : null,
    profile.preferredMajors.length > 0
      ? `专业偏好：${profile.preferredMajors.join("、")}`
      : null,
    profile.rejectedMajors.length > 0
      ? `明确不读：${profile.rejectedMajors.join("、")}`
      : null,
    profile.preferredRegions.length > 0
      ? `地域偏好：${profile.preferredRegions.join("、")}优先`
      : null,
    profile.preferredSchoolCities.length > 0
      ? `城市偏好：${profile.preferredSchoolCities.join("、")}`
      : null,
    profile.rejectedSchoolProvinces.length > 0
      ? `明确排除：${profile.rejectedSchoolProvinces.join("、")}省内院校`
      : null,
    profile.distancePreference === "province_outside"
      ? "距离诉求：省外优先"
      : profile.distancePreference === "far_from_home"
        ? "距离诉求：离家远一点"
        : null,
    profile.acceptPrivate === false ? "明确排除：民办" : null,
    profile.acceptSinoForeign === false ? "明确排除：中外合作" : null,
  ];

  return items.filter((item): item is string => Boolean(item));
}

function hasRequiredProfile(profile: GaokaoProfile) {
  return Boolean(
    profile.studentName &&
      profile.subjectType &&
      profile.score,
  );
}

export function GaokaoAssistantApp({
  currentUser,
  initialReports,
  initialDataStatus,
  initialGenerationStatus,
}: Props) {
  const [user, setUser] = useState(currentUser);
  const [profile, setProfile] = useState<GaokaoProfile>(createEmptyGaokaoProfile);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatItem[]>([
    { role: "assistant", content: initialAssistantMessage },
  ]);
  const [reports, setReports] = useState(initialReports);
  const [dataStatus, setDataStatus] = useState(initialDataStatus);
  const [generationStatus, setGenerationStatus] = useState(
    initialGenerationStatus,
  );
  const [isChatting, setIsChatting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<GaokaoReportListItem | null>(
    null,
  );
  const [isReportCollapsed, setIsReportCollapsed] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const activeReport = reports[0] ?? null;
  const showReadOnlyReport = Boolean(activeReport && !generationStatus.canGenerate);
  const visibleReport =
    !isReportCollapsed && (selectedReport ?? (showReadOnlyReport ? activeReport : null));
  const canGenerate = Boolean(user && generationStatus.canGenerate);
  const canSubmit = canGenerate && hasRequiredProfile(profile);
  const hasCompleteProfile = hasRequiredProfile(profile);
  const reportCountLabel = useMemo(
    () =>
      `已生成 ${generationStatus.totalReports} 次，已删除 ${generationStatus.deletedReports} 次`,
    [generationStatus.deletedReports, generationStatus.totalReports],
  );

  const refreshReports = useCallback(async () => {
    const response = await fetch(apiPath("/gaokao/reports"), {
      credentials: "include",
    }).catch(() => null);

    if (!response?.ok) {
      return;
    }

    const payload = (await response.json()) as {
      reports: GaokaoReportListItem[];
      dataStatus: GaokaoDataStatus;
      generationStatus: GaokaoGenerationStatus;
    };
    setReports(payload.reports);
    setDataStatus(payload.dataStatus);
    setGenerationStatus(payload.generationStatus);
  }, []);

  const refreshAuthUser = useCallback(async (detail?: CurrentUserProfile) => {
    if (detail) {
      setUser(detail);
    }

    const response = await fetch(apiPath("/auth/check"), {
      credentials: "include",
    }).catch(() => null);

    if (response?.ok) {
      const payload = (await response.json()) as {
        user?: {
          nickname?: string;
          avatar_url?: string | null;
          avatarUrl?: string | null;
        };
      };
      setUser({
        nickname: payload.user?.nickname ?? detail?.nickname ?? "大宜宾用户",
        avatarUrl:
          payload.user?.avatar_url ?? payload.user?.avatarUrl ?? detail?.avatarUrl ?? null,
      });
    }

    await refreshReports();
  }, [refreshReports]);

  useEffect(() => {
    function handleAuthReady(event: Event) {
      const detail = (event as CustomEvent<CurrentUserProfile>).detail;
      void refreshAuthUser(detail);
    }

    window.addEventListener("aidayibin:auth-ready", handleAuthReady);
    return () => {
      window.removeEventListener("aidayibin:auth-ready", handleAuthReady);
    };
  }, [refreshAuthUser]);

  function updateProfile(patch: Partial<GaokaoProfile>) {
    setProfile((current) => ({ ...current, ...patch }));
  }

  function setFirstChoiceSubject(subject: GaokaoFirstChoiceSubject) {
    updateProfile({
      firstChoiceSubject: subject,
      subjectType: subjectTypeFromFirstChoice(subject),
    });
  }

  function toggleOptionalSubject(subject: GaokaoOptionalSubject) {
    setProfile((current) => {
      const selected = current.optionalSubjects.includes(subject);
      const optionalSubjects = selected
        ? current.optionalSubjects.filter((item) => item !== subject)
        : current.optionalSubjects.length >= 2
          ? current.optionalSubjects
          : [...current.optionalSubjects, subject];

      return { ...current, optionalSubjects };
    });
  }

  function resetForNewProfile() {
    setProfile(createEmptyGaokaoProfile());
    setMessage("");
    setChat([{ role: "assistant", content: initialAssistantMessage }]);
    setSelectedReport(null);
    setIsReportCollapsed(true);
    setIsProfileExpanded(true);
    setNotice("已清空当前填写内容，可以重新测试一份报告。");
  }

  async function sendMessage() {
    const trimmed = message.trim();

    if (!trimmed || isChatting || !canGenerate) {
      return;
    }

    setMessage("");
    setIsChatting(true);
    setNotice(null);
    setChat((items) => [...items, { role: "user", content: trimmed }]);

    try {
      const response = await fetch(apiPath("/gaokao/chat"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: trimmed, profile }),
      });
      const payload = (await response.json()) as {
        profile?: GaokaoProfile;
        assistantMessage?: string;
        dataStatus?: GaokaoDataStatus;
        error?: { message: string };
      };

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "发送失败");
      }

      if (payload.profile) {
        setProfile(payload.profile);
      }

      if (payload.dataStatus) {
        setDataStatus(payload.dataStatus);
      }

      setChat((items) => [
        ...items,
        {
          role: "assistant",
          content: payload.assistantMessage ?? "我收到了，继续补充你的偏好。",
        },
      ]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "发送失败");
    } finally {
      setIsChatting(false);
    }
  }

  async function generateReport() {
    if (!canSubmit || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setNotice(null);

    try {
      const response = await fetch(apiPath("/gaokao/recommend"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profile }),
      });
      const payload = (await response.json()) as {
        report?: GaokaoReportListItem;
        dataStatus?: GaokaoDataStatus;
        profile?: GaokaoProfile;
        generationStatus?: GaokaoGenerationStatus;
        error?: { message: string };
      };

      if (!response.ok || !payload.report) {
        throw new Error(payload.error?.message ?? "生成失败");
      }

      if (payload.profile) {
        setProfile(payload.profile);
      }

      if (payload.dataStatus) {
        setDataStatus(payload.dataStatus);
      }

      if (payload.generationStatus) {
        setGenerationStatus(payload.generationStatus);
      }

      setReports((items) => [
        payload.report!,
        ...items.filter((item) => item.id !== payload.report!.id),
      ]);
      setSelectedReport(payload.report);
      setIsReportCollapsed(false);
      setNotice("报告已生成，已打开完整报告。");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "生成失败");
    } finally {
      setIsGenerating(false);
    }
  }

  async function deleteReport(id: string) {
    const response = await fetch(apiPath(`/gaokao/reports/${id}`), {
      method: "DELETE",
      credentials: "include",
    }).catch(() => null);

    if (!response?.ok) {
      setNotice("删除失败，请稍后再试。");
      return;
    }

    await refreshReports();
    if (selectedReport?.id === id) {
      setSelectedReport(null);
      setIsReportCollapsed(true);
    }
    setNotice("报告已删除。若还有纠错机会，可以重新生成。");
  }

  async function shareReport(report: GaokaoReportListItem) {
    await shareImage({
      title: "我用大宜宾 AI 做了一份高考志愿初筛",
      description: "点击查看分享卡片，完整报告请打开大宜宾 App。",
      imageUrl: report.shareImageUrl,
      pageUrl: report.sharePageUrl,
    });
  }

  return (
    <main className="min-h-screen bg-[#eef5ff] text-[#111827]">
      <div className="mx-auto w-full max-w-[520px] px-4 pb-5 lg:max-w-5xl">
        <header className="flex h-14 items-center justify-between">
          <span className="w-10" />
          <h1 className="text-base font-black tracking-normal">大宜宾 AI 能力平台</h1>
          <MiniUserAvatar user={user} />
        </header>

        <section className="relative overflow-hidden rounded-b-[8px] bg-[#e8f1ff] px-4 pb-6 pt-5 shadow-[0_14px_34px_rgba(31,96,196,0.10)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#eef6ff_0%,rgba(238,246,255,0.92)_45%,rgba(238,246,255,0.22)_100%)]" />
          <div className="relative min-h-[128px]">
            <div className="flex max-w-[250px] flex-col justify-center pt-4">
              <p className="text-[30px] font-black leading-tight tracking-normal text-[#101828]">
                高考填报 <span className="text-[#1769e8]">AI 助手</span>
              </p>
              <p className="mt-2 text-sm font-medium leading-5 text-[#667085]">
                四川考生专用，填分数即可做冲稳保初筛
              </p>
            </div>
          </div>
        </section>

        {!user ? (
          <div className="mt-3 rounded-[8px] border border-[#e2d8b8] bg-[#fff8df] p-3 text-sm leading-6 text-[#69552b]">
            请先在大宜宾 App 内登录后使用。
          </div>
        ) : null}

        {notice ? (
          <div className="mt-3 rounded-[8px] border border-[#e8d2d2] bg-[#fff1f1] p-3 text-sm text-[#8a3d3d]">
            {notice}
          </div>
        ) : null}

        {generationStatus.isUnlimitedTestUser ? (
          <button
            type="button"
            onClick={resetForNewProfile}
            className="mt-3 inline-flex h-9 items-center gap-1 rounded-[8px] bg-white px-3 text-sm font-black text-[#1769e8] shadow-sm"
          >
            <RefreshCcw size={15} />
            重新填写
          </button>
        ) : null}

        {visibleReport ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setSelectedReport(null);
                setIsReportCollapsed(true);
              }}
              className="mb-3 inline-flex h-9 items-center justify-center rounded-[8px] bg-white px-3 text-sm font-black text-[#1769e8] shadow-sm"
            >
              返回顾问确认
            </button>
            <GaokaoReportView
              summary={visibleReport.summary}
              profile={visibleReport.profile}
              recommendations={visibleReport.recommendations}
            />
          </div>
        ) : (
          <>
            <CandidateForm
              profile={profile}
              disabled={!canGenerate}
              isExpanded={!hasCompleteProfile || isProfileExpanded}
              canCollapse={hasCompleteProfile}
              onUpdate={updateProfile}
              onExpandChange={setIsProfileExpanded}
              onFirstChoiceSubjectChange={setFirstChoiceSubject}
              onOptionalSubjectToggle={toggleOptionalSubject}
            />

            <FeatureCards />

            <AdvisorPanel
              profile={profile}
              chat={chat}
              message={message}
              canGenerate={canGenerate}
              isChatting={isChatting}
              onMessage={setMessage}
              onSend={() => void sendMessage()}
            />

            <button
              type="button"
              onClick={() => void generateReport()}
              disabled={!canSubmit || isGenerating}
              className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-[#1769e8] px-4 text-base font-black text-white shadow-[0_10px_24px_rgba(23,105,232,0.28)] disabled:bg-[#9dbff4] disabled:shadow-none"
            >
              {isGenerating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles size={18} />
              )}
              {isGenerating ? "正在分析" : "按以上条件开始分析"}
            </button>
          </>
        )}

        <DataStatusBar dataStatus={dataStatus} />

        <ReportList
          reports={reports}
          reportCountLabel={reportCountLabel}
          message={generationStatus.message}
          onView={(report) => {
            setSelectedReport(report);
            setIsReportCollapsed(false);
          }}
          onShare={shareReport}
          onDelete={deleteReport}
        />
      </div>
    </main>
  );
}

function MiniUserAvatar({ user }: { user: CurrentUserProfile | null }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
      {user?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatarUrl}
          alt={user.nickname}
          className="h-9 w-9 rounded-full object-cover"
        />
      ) : (
        <UserRound size={18} className="text-[#667085]" />
      )}
    </div>
  );
}

function CandidateForm({
  profile,
  disabled,
  isExpanded,
  canCollapse,
  onUpdate,
  onExpandChange,
  onFirstChoiceSubjectChange,
  onOptionalSubjectToggle,
}: {
  profile: GaokaoProfile;
  disabled: boolean;
  isExpanded: boolean;
  canCollapse: boolean;
  onUpdate: (patch: Partial<GaokaoProfile>) => void;
  onExpandChange: (expanded: boolean) => void;
  onFirstChoiceSubjectChange: (subject: GaokaoFirstChoiceSubject) => void;
  onOptionalSubjectToggle: (subject: GaokaoOptionalSubject) => void;
}) {
  const batchOptions = ["本科批", "专科批", "提前批"];

  return (
    <section className="mt-3 rounded-[8px] bg-white px-4 pb-4 pt-3 shadow-[0_10px_28px_rgba(20,83,180,0.08)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#eef2f7] pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#e9f2ff] text-[#1769e8]">
            <BookOpenCheck size={17} />
          </span>
          <h2 className="text-base font-black text-[#101828]">考生信息</h2>
        </div>
        {canCollapse ? (
          <button
            type="button"
            onClick={() => onExpandChange(!isExpanded)}
            className="inline-flex h-8 items-center gap-1 rounded-[8px] bg-[#f3f7ff] px-3 text-xs font-black text-[#1769e8]"
          >
            {isExpanded ? "收起" : "修改"}
            <ChevronRight
              size={14}
              className={isExpanded ? "-rotate-90" : "rotate-90"}
            />
          </button>
        ) : null}
      </div>

      {!isExpanded && canCollapse ? (
        <CandidateSummary profile={profile} />
      ) : (
      <div className="mt-3 space-y-2.5">
        <CompactField label="姓名">
          <input
            value={profile.studentName ?? ""}
            onChange={(event) =>
              onUpdate({ studentName: event.target.value.trim() || null })
            }
            disabled={disabled}
            aria-label="姓名"
            className="h-10 w-full rounded-[8px] border border-[#dfe6f0] bg-white px-3 text-sm text-[#101828] outline-none focus:border-[#1769e8] disabled:bg-[#f4f6f9] disabled:text-[#98a2b3]"
            placeholder="用于报告展示"
          />
        </CompactField>

        <CompactField label="科目">
          <SubjectSelector
            profile={profile}
            disabled={disabled}
            onFirstChoiceSubjectChange={onFirstChoiceSubjectChange}
            onOptionalSubjectToggle={onOptionalSubjectToggle}
          />
        </CompactField>

        <CompactField label="分数">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={750}
            value={profile.score ?? ""}
            onChange={(event) =>
              onUpdate({
                score: event.target.value ? Number(event.target.value) : null,
              })
            }
            disabled={disabled}
            aria-label="分数"
            className="h-10 w-full rounded-[8px] border border-[#dfe6f0] bg-white px-3 text-sm text-[#101828] outline-none focus:border-[#1769e8] disabled:bg-[#f4f6f9] disabled:text-[#98a2b3]"
            placeholder="不含加分"
          />
        </CompactField>

        <CompactField label="目标批次">
          <div className="grid grid-cols-3 gap-2">
            {batchOptions.map((batch) => (
              <button
                key={batch}
                type="button"
                disabled={disabled}
                onClick={() => onUpdate({ batch })}
                className={`h-9 rounded-[8px] border text-xs font-black ${
                  profile.batch === batch
                    ? "border-[#d8ae45] bg-[#fff7df] text-[#8b6817]"
                    : "border-[#e4e9f2] bg-white text-[#475467]"
                } disabled:opacity-50`}
              >
                {batch}
              </button>
            ))}
          </div>
        </CompactField>

        <CompactField label="限制条件">
          <div className="grid grid-cols-3 gap-2">
            <Toggle
              label="调剂"
              checked={profile.acceptAdjustment === true}
              disabled={disabled}
              onChange={(checked) => onUpdate({ acceptAdjustment: checked })}
            />
            <Toggle
              label="民办"
              checked={profile.acceptPrivate === true}
              disabled={disabled}
              onChange={(checked) => onUpdate({ acceptPrivate: checked })}
            />
            <Toggle
              label="中外"
              checked={profile.acceptSinoForeign === true}
              disabled={disabled}
              onChange={(checked) => onUpdate({ acceptSinoForeign: checked })}
            />
          </div>
        </CompactField>
      </div>
      )}
    </section>
  );
}

function CandidateSummary({ profile }: { profile: GaokaoProfile }) {
  const items = [
    ["姓名", profile.studentName ?? "未填"],
    ["科目", formatSubjectSelection(profile) || "未选"],
    ["分数", profile.score ? `${profile.score} 分` : "未填"],
  ];

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-[8px] bg-[#f7faff] px-3 py-2">
          <p className="text-[11px] font-bold text-[#667085]">{label}</p>
          <p className="mt-1 truncate text-sm font-black text-[#101828]">{value}</p>
        </div>
      ))}
    </div>
  );
}

function SubjectSelector({
  profile,
  disabled,
  onFirstChoiceSubjectChange,
  onOptionalSubjectToggle,
}: {
  profile: GaokaoProfile;
  disabled: boolean;
  onFirstChoiceSubjectChange: (subject: GaokaoFirstChoiceSubject) => void;
  onOptionalSubjectToggle: (subject: GaokaoOptionalSubject) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const isPanelOpen = isOpen || !profile.firstChoiceSubject;
  const label = formatSubjectSelection(profile);

  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-10 w-full items-center justify-between rounded-[8px] border border-[#dfe6f0] bg-white px-3 text-left text-sm font-bold text-[#101828] outline-none focus:border-[#1769e8] disabled:bg-[#f4f6f9] disabled:text-[#98a2b3]"
      >
        <span>{label || "选择首选和选考"}</span>
        <ChevronRight
          size={16}
          className={`text-[#98a2b3] ${isPanelOpen ? "rotate-90" : ""}`}
        />
      </button>

      {isPanelOpen ? (
        <div className="mt-2 space-y-2 rounded-[8px] border border-[#edf2f7] bg-[#fbfcff] p-2">
          <div>
            <p className="mb-1 text-xs font-black text-[#667085]">首选</p>
            <div className="grid grid-cols-2 gap-2">
              {(["物理", "历史"] as const).map((subject) => (
                <button
                  key={subject}
                  type="button"
                  disabled={disabled}
                  onClick={() => onFirstChoiceSubjectChange(subject)}
                  className={`h-9 rounded-[8px] border text-sm font-black ${
                    profile.firstChoiceSubject === subject
                      ? "border-[#1769e8] bg-[#eaf2ff] text-[#1769e8]"
                      : "border-[#e4e9f2] bg-white text-[#475467]"
                  } disabled:opacity-50`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-black text-[#667085]">选考，最多 2 门</p>
            <div className="grid grid-cols-2 gap-2">
              {optionalSubjectOptions.map((subject) => {
                const selected = profile.optionalSubjects.includes(subject);
                const maxed = !selected && profile.optionalSubjects.length >= 2;

                return (
                  <button
                    key={subject}
                    type="button"
                    disabled={disabled || maxed}
                    onClick={() => onOptionalSubjectToggle(subject)}
                    className={`h-9 rounded-[8px] border text-sm font-black ${
                      selected
                        ? "border-[#d8ae45] bg-[#fff7df] text-[#8b6817]"
                        : "border-[#e4e9f2] bg-white text-[#475467]"
                    } disabled:opacity-40`}
                  >
                    {subject}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FeatureCards() {
  return (
    <section className="mt-3 grid grid-cols-3 gap-2">
      {featureCards.map((card) => (
        <FeatureCard key={card.title} {...card} />
      ))}
    </section>
  );
}

function FeatureCard({
  title,
  desc,
  tone,
  imageUrl,
}: {
  title: string;
  desc: string;
  tone: "blue" | "green" | "purple";
  imageUrl: string;
}) {
  const styles = {
    blue: "border-[#cfe0ff] bg-[linear-gradient(180deg,#fbfdff_0%,#f1f7ff_100%)]",
    green: "border-[#cdeee6] bg-[linear-gradient(180deg,#fbfffd_0%,#f0fffa_100%)]",
    purple: "border-[#ded7ff] bg-[linear-gradient(180deg,#fdfcff_0%,#f6f2ff_100%)]",
  };

  return (
    <article
      className={`min-h-[110px] rounded-[8px] border p-3 shadow-[0_10px_24px_rgba(31,96,196,0.08)] ${styles[tone]}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        aria-hidden="true"
        className="h-11 w-11 rounded-full object-cover shadow-[0_8px_16px_rgba(31,96,196,0.12)]"
      />
      <h3 className="mt-2 text-sm font-black leading-5 text-[#101828]">{title}</h3>
      <p className="mt-1 text-[11px] font-medium leading-4 text-[#667085]">
        {desc}
      </p>
    </article>
  );
}

function AdvisorPanel({
  profile,
  chat,
  message,
  canGenerate,
  isChatting,
  onMessage,
  onSend,
}: {
  profile: GaokaoProfile;
  chat: ChatItem[];
  message: string;
  canGenerate: boolean;
  isChatting: boolean;
  onMessage: (value: string) => void;
  onSend: () => void;
}) {
  const visibleChat = chat.slice(-8);
  const confirmItems = buildAdvisorConfirmItems(profile);

  return (
    <aside className="mt-3 rounded-[8px] bg-white p-4 shadow-[0_10px_28px_rgba(20,83,180,0.08)]">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#fff4df] text-[#b7791f]">
          <Sparkles size={17} />
        </span>
        <div>
          <h2 className="text-base font-black text-[#101828]">顾问确认</h2>
          <p className="text-xs font-medium text-[#667085]">
            先补充偏好，确认后再开始分析
          </p>
        </div>
      </div>

      <p className="mt-3 break-words rounded-[8px] bg-[#f7faff] px-3 py-2 text-xs font-medium leading-5 text-[#475467]">
        {formatProfile(profile) || "先把考生信息补齐。"}
      </p>

      {confirmItems.length > 0 ? (
        <div className="mt-3 border-t border-[#eef2f7] pt-3">
          <p className="text-xs font-black text-[#101828]">按以上条件分析</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-[#475467]">
            {confirmItems.map((item) => (
              <li key={item} className="break-words">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
        {visibleChat.map((item, index) => (
          <ChatMessageBubble
            key={`${item.role}-${index}`}
            item={item}
          />
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <textarea
          value={message}
          onChange={(event) => onMessage(event.target.value)}
          placeholder="补充偏好：如远离四川、东北优先，计算机方向，不想读民办。"
          className="min-h-16 flex-1 resize-none rounded-[8px] border border-[#dfe6f0] bg-white px-3 py-2 text-sm leading-5 text-[#101828] outline-none focus:border-[#1769e8] disabled:bg-[#f4f6f9]"
          disabled={!canGenerate || isChatting}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!canGenerate || isChatting || !message.trim()}
          className="inline-flex w-11 items-center justify-center rounded-[8px] bg-[#1769e8] text-white disabled:opacity-40"
          title="发送"
        >
          {isChatting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send size={18} />}
        </button>
      </div>

    </aside>
  );
}

function ChatMessageBubble({ item }: { item: ChatItem }) {
  const paragraphs = item.content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div
      className={
        item.role === "user"
          ? "ml-auto max-w-[88%] space-y-1 rounded-[8px] bg-[#1769e8] px-3 py-2 text-xs leading-5 text-white"
          : "max-w-[92%] space-y-1 rounded-[8px] bg-[#eef4ff] px-3 py-2 text-xs leading-5 text-[#344054]"
      }
    >
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="whitespace-pre-wrap break-words">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function CompactField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-2">
      <span className="text-sm font-black text-[#101828]">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex h-9 items-center justify-center gap-1.5 rounded-[8px] border border-[#e4e9f2] bg-white px-2 text-xs font-black text-[#475467]">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function DataStatusBar({ dataStatus }: { dataStatus: GaokaoDataStatus }) {
  const hasGap = dataStatus.missingSichuanData || dataStatus.importedCount === 0;

  return (
    <section className="mt-3 flex items-center gap-2 rounded-[8px] bg-[#eaf2ff] px-3 py-2 text-xs font-bold text-[#2456a6]">
      {hasGap ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
      <span className="min-w-0 flex-1 truncate">
        {hasGap
          ? "数据仍在补充，当前结果仅作初筛参考"
          : "已接入：批次线 / 一分一段表 / 近年院校专业投档数据"}
      </span>
      <ChevronRight size={16} className="shrink-0" />
    </section>
  );
}

function ReportList({
  reports,
  reportCountLabel,
  message,
  onView,
  onShare,
  onDelete,
}: {
  reports: GaokaoReportListItem[];
  reportCountLabel: string;
  message: string;
  onView: (report: GaokaoReportListItem) => void;
  onShare: (report: GaokaoReportListItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="mt-3 rounded-[8px] bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <History size={17} className="text-[#1769e8]" />
          <h2 className="truncate text-sm font-black text-[#101828]">报告记录</h2>
        </div>
        <span className="shrink-0 text-xs font-bold text-[#667085]">
          {reportCountLabel}
        </span>
      </div>
      <p className="mt-1 text-xs leading-5 text-[#667085]">{message}</p>

      {reports.length > 0 ? (
        <div className="mt-3 space-y-2">
          {reports.slice(0, 3).map((report) => (
            <article
              key={report.id}
              className="rounded-[8px] border border-[#eef2f7] bg-[#fbfcff] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-black text-[#101828]">
                    {report.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#667085]">
                    {new Date(report.createdAt).toLocaleString("zh-CN", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onView(report)}
                    className="flex h-8 items-center gap-1 rounded-[8px] bg-[#eef7ef] px-2 text-xs font-black text-[#247047]"
                    title="查看"
                  >
                    <Eye size={14} />
                    查看
                  </button>
                  <button
                    type="button"
                    onClick={() => onShare(report)}
                    className="flex h-8 items-center gap-1 rounded-[8px] bg-[#eaf2ff] px-2 text-xs font-black text-[#1769e8]"
                    title="分享"
                  >
                    <Share2 size={14} />
                    分享
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(report.id)}
                    className="flex h-8 items-center gap-1 rounded-[8px] bg-[#fff1f1] px-2 text-xs font-black text-[#d92d20]"
                    title="删除"
                  >
                    <Trash2 size={14} />
                    删除
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
