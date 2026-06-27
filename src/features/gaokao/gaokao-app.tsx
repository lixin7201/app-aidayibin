"use client";

import {
  AlertTriangle,
  BookOpenCheck,
  FileText,
  History,
  Loader2,
  Send,
  Share2,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type {
  GaokaoDataStatus,
  GaokaoProfile,
  GaokaoRecommendationItem,
  GaokaoRecommendations,
  GaokaoReportListItem,
} from "@/features/gaokao/types";
import { createEmptyGaokaoProfile, getRiskPreferenceLabel } from "@/features/gaokao/types";
import { apiPath } from "@/lib/routes";
import { shareImage } from "@/lib/qfh5-actions";

type CurrentUserProfile = {
  nickname: string;
  avatarUrl: string | null;
};

type Props = {
  currentUser: CurrentUserProfile | null;
  initialReports: GaokaoReportListItem[];
  initialDataStatus: GaokaoDataStatus;
};

type ChatItem = {
  role: "assistant" | "user";
  content: string;
};

const initialAssistantMessage =
  "先把情况摆上桌：你是四川物理类还是历史类？今年分数和全省位次是多少？想优先专业、学校、城市，还是先稳住录取？";

function countRecommendations(recommendations: GaokaoRecommendations) {
  return (
    recommendations.chong.length +
    recommendations.wen.length +
    recommendations.bao.length
  );
}

function formatProfile(profile: GaokaoProfile) {
  return [
    profile.subjectType,
    profile.score ? `${profile.score}分` : null,
    profile.rank ? `位次 ${profile.rank}` : null,
    profile.preferredMajors.length > 0
      ? `想看 ${profile.preferredMajors.join("、")}`
      : null,
    `策略 ${getRiskPreferenceLabel(profile.riskPreference)}`,
  ]
    .filter(Boolean)
    .join(" / ");
}

export function GaokaoAssistantApp({
  currentUser,
  initialReports,
  initialDataStatus,
}: Props) {
  const [profile, setProfile] = useState<GaokaoProfile>(createEmptyGaokaoProfile);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatItem[]>([
    { role: "assistant", content: initialAssistantMessage },
  ]);
  const [reports, setReports] = useState(initialReports);
  const [dataStatus, setDataStatus] = useState(initialDataStatus);
  const [recommendations, setRecommendations] =
    useState<GaokaoRecommendations>({ chong: [], wen: [], bao: [] });
  const [summary, setSummary] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const recommendationCount = useMemo(
    () => countRecommendations(recommendations),
    [recommendations],
  );

  async function refreshReports() {
    const response = await fetch(apiPath("/gaokao/reports")).catch(() => null);

    if (!response?.ok) {
      return;
    }

    const payload = (await response.json()) as {
      reports: GaokaoReportListItem[];
      dataStatus: GaokaoDataStatus;
    };
    setReports(payload.reports);
    setDataStatus(payload.dataStatus);
  }

  useEffect(() => {
    function handleAuthReady() {
      void refreshReports();
    }

    window.addEventListener("aidayibin:auth-ready", handleAuthReady);
    return () => {
      window.removeEventListener("aidayibin:auth-ready", handleAuthReady);
    };
  }, []);

  async function sendMessage() {
    const trimmed = message.trim();

    if (!trimmed || isChatting) {
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

  async function generateRecommendations() {
    setIsRecommending(true);
    setNotice(null);

    try {
      const response = await fetch(apiPath("/gaokao/recommend"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const payload = (await response.json()) as {
        profile?: GaokaoProfile;
        dataStatus?: GaokaoDataStatus;
        recommendations?: GaokaoRecommendations;
        summary?: string;
        error?: { message: string };
      };

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "生成失败");
      }

      if (payload.dataStatus) {
        setDataStatus(payload.dataStatus);
      }

      if (payload.profile) {
        setProfile(payload.profile);
      }

      setRecommendations(payload.recommendations ?? { chong: [], wen: [], bao: [] });
      setSummary(payload.summary ?? "");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "生成失败");
    } finally {
      setIsRecommending(false);
    }
  }

  async function saveReport() {
    if (!summary) {
      setNotice("先生成一份初筛结果，再保存报告。");
      return;
    }

    setIsSaving(true);
    setNotice(null);

    try {
      const response = await fetch(apiPath("/gaokao/reports"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile, recommendations, summary }),
      });
      const payload = (await response.json()) as {
        report?: GaokaoReportListItem;
        error?: { message: string };
      };

      if (!response.ok || !payload.report) {
        throw new Error(payload.error?.message ?? "保存失败");
      }

      setReports((items) => [payload.report!, ...items]);
      setNotice("报告已保存，可以分享给家人一起看。");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "保存失败");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteReport(id: string) {
    await fetch(apiPath(`/gaokao/reports/${id}`), { method: "DELETE" });
    setReports((items) => items.filter((item) => item.id !== id));
  }

  async function shareReport(report: GaokaoReportListItem) {
    await shareImage({
      title: "我用大宜宾 AI 做了一份高考志愿初筛",
      description: "输入分数和位次，看看冲稳保怎么初筛。结果仅供参考，正式填报以官方为准。",
      imageUrl: "/globe.svg",
      pageUrl: report.sharePageUrl,
    });
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-4 text-[#1f2523] sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
          <header className="border-b border-black/8 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6a3a]">
              大宜宾 AI
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-normal text-[#1f2523]">
              高考填报 AI 助手
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f675f]">
              四川考生专用。先把分数、位次、偏好说清楚，再用数据做冲稳保初筛。
            </p>
          </header>

          {!currentUser ? (
            <div className="mt-4 rounded-[8px] border border-[#e2d8b8] bg-[#fff8df] p-4 text-sm leading-6 text-[#69552b]">
              请先在大宜宾 App 内登录后使用。这个工具会保存你的志愿报告历史，必须确认是本人账号。
            </div>
          ) : null}

          {dataStatus.missingSichuanData ? (
            <div className="mt-4 flex gap-3 rounded-[8px] border border-[#ead2a4] bg-[#fff8e5] p-4 text-sm leading-6 text-[#6d5322]">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                当前还没有导入四川历史投档数据。聊天和画像确认可以先跑通，但正式冲稳保推荐需要补四川数据后才准确。
                已接入 2026 批次线 {dataStatus.batchLineCount} 条、一分一段关键点 {dataStatus.scoreSegmentCount} 条。
              </p>
            </div>
          ) : null}

          {notice ? (
            <div className="mt-4 rounded-[8px] border border-[#e8d2d2] bg-[#fff1f1] p-3 text-sm text-[#8a3d3d]">
              {notice}
            </div>
          ) : null}

          <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-[8px] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-black/6 pb-3">
                <BookOpenCheck size={18} />
                <h2 className="text-base font-black">顾问对话</h2>
              </div>
              <div className="mt-3 max-h-[460px] space-y-3 overflow-y-auto pr-1">
                {chat.map((item, index) => (
                  <div
                    key={`${item.role}-${index}`}
                    className={
                      item.role === "user"
                        ? "ml-auto max-w-[88%] rounded-[8px] bg-[#1f2523] px-3 py-2 text-sm leading-6 text-white"
                        : "max-w-[92%] rounded-[8px] bg-[#eef2e8] px-3 py-2 text-sm leading-6 text-[#30382f]"
                    }
                  >
                    {item.content}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="例：四川物理类 588 分，位次 32000，想看计算机，成都重庆优先，不太想读民办。"
                  className="min-h-20 flex-1 resize-none rounded-[8px] border border-black/10 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-[#7a6a3a]"
                  disabled={!currentUser || isChatting}
                />
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={!currentUser || isChatting || !message.trim()}
                  className="inline-flex w-12 items-center justify-center rounded-[8px] bg-[#1f2523] text-white disabled:opacity-40"
                  title="发送"
                >
                  {isChatting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>

            <aside className="rounded-[8px] bg-white p-4 shadow-sm">
              <h2 className="text-base font-black">考生画像</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <ProfileRow label="科类" value={profile.subjectType ?? "待确认"} />
                <ProfileRow label="分数" value={profile.score ? `${profile.score} 分` : "待确认"} />
                <ProfileRow label="位次" value={profile.rank ? `${profile.rank}` : "建议补充"} />
                <ProfileRow
                  label="专业"
                  value={profile.preferredMajors.join("、") || "待确认"}
                />
                <ProfileRow
                  label="城市"
                  value={profile.preferredCities.join("、") || "未限制"}
                />
                <ProfileRow
                  label="策略"
                  value={getRiskPreferenceLabel(profile.riskPreference)}
                />
              </dl>
              <button
                type="button"
                onClick={() => void generateRecommendations()}
                disabled={!currentUser || isRecommending}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[#7a6a3a] px-4 text-sm font-black text-white disabled:opacity-40"
              >
                {isRecommending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText size={17} />}
                生成冲稳保初筛
              </button>
              <p className="mt-3 text-xs leading-5 text-[#6d766d]">
                {formatProfile(profile) || "先在左侧把基本情况说清楚。"}
              </p>
            </aside>
          </section>

          <section className="mt-4 rounded-[8px] bg-white p-4 shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-black/6 pb-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-base font-black">初筛结果</h2>
                <p className="mt-1 text-xs text-[#6d766d]">
                  共 {recommendationCount} 条。数据筛选决定名单，AI 只负责解释。
                </p>
              </div>
              <button
                type="button"
                onClick={() => void saveReport()}
                disabled={!currentUser || isSaving || !summary}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[#1f2523] px-4 text-sm font-bold text-white disabled:opacity-40"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <History size={16} />}
                保存报告
              </button>
            </div>

            {summary ? (
              <div className="mt-4 whitespace-pre-wrap rounded-[8px] bg-[#f5f7f1] p-4 text-sm leading-7 text-[#333b32]">
                {summary}
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <Bucket title="冲一冲" items={recommendations.chong} />
              <Bucket title="稳一稳" items={recommendations.wen} />
              <Bucket title="保一保" items={recommendations.bao} />
            </div>
          </section>
        </section>

        <aside className="rounded-[8px] bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:self-start">
          <div className="flex items-center gap-2 border-b border-black/6 pb-3">
            <History size={18} />
            <h2 className="text-base font-black">历史报告</h2>
          </div>
          <div className="mt-3 space-y-3">
            {reports.length === 0 ? (
              <p className="text-sm leading-6 text-[#6d766d]">
                暂无报告。生成并保存后，可以分享给家人一起商量。
              </p>
            ) : null}
            {reports.map((report) => (
              <div key={report.id} className="rounded-[8px] border border-black/8 p-3">
                <p className="text-sm font-black">{report.title}</p>
                <p className="mt-1 text-xs leading-5 text-[#6d766d]">
                  {formatProfile(report.profile)}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void shareReport(report)}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-[8px] bg-[#eef2e8] text-xs font-bold text-[#30382f]"
                  >
                    <Share2 size={14} />
                    分享
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteReport(report.id)}
                    className="inline-flex h-9 w-10 items-center justify-center rounded-[8px] bg-[#fff0ed] text-[#b64a3c]"
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-black/5 pb-2">
      <dt className="text-[#6d766d]">{label}</dt>
      <dd className="truncate text-right font-bold">{value}</dd>
    </div>
  );
}

function Bucket({
  title,
  items,
}: {
  title: string;
  items: GaokaoRecommendationItem[];
}) {
  return (
    <div>
      <h3 className="text-sm font-black">{title}</h3>
      <div className="mt-2 space-y-2">
        {items.length === 0 ? (
          <p className="rounded-[8px] bg-[#f5f7f1] p-3 text-xs leading-5 text-[#6d766d]">
            暂无数据。可以放宽专业偏好，或等待四川数据导入。
          </p>
        ) : null}
        {items.map((item) => (
          <div key={item.id} className="rounded-[8px] border border-black/8 p-3">
            <p className="text-sm font-black">{item.schoolName}</p>
            <p className="mt-1 text-xs leading-5 text-[#4c554c]">
              {item.majorName ?? "专业未标注"}
            </p>
            <p className="mt-2 text-xs text-[#6d766d]">
              {item.year} 年 / {item.score ?? "-"} 分 / 位次 {item.rank ?? "-"}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#7a6a3a]">{item.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
