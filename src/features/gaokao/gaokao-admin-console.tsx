"use client";

import {
  ArrowLeft,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  ShieldOff,
  UsersRound,
  Eye,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import type { GaokaoAdminUserRow } from "@/features/gaokao/gaokao-admin-service";
import { apiPath, appPath } from "@/lib/routes";

type Overview = {
  recentUsers: number;
  totalUsers: number;
  totalReports: number;
  unlimitedUsers: number;
};

type AuditLog = {
  id: string;
  action: string;
  targetId: string | null;
  metadata: unknown;
  createdAt: string;
};

type UserDetail = {
  user: GaokaoAdminUserRow;
  reports: Array<{
    id: string;
    title: string;
    createdAt: string;
    deletedAt: string | null;
  }>;
};

type Props = {
  admin: {
    nickname: string;
    appUserId: string;
  };
  initialOverview: Overview;
  initialUsers: GaokaoAdminUserRow[];
  initialAuditLogs: AuditLog[];
};

function formatTime(value: string | null) {
  if (!value) {
    return "无记录";
  }

  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActionLabel(action: string) {
  if (action === "reset_generation_limit") {
    return "重置机会";
  }

  if (action === "enable_unlimited_generation") {
    return "开启无限";
  }

  if (action === "disable_unlimited_generation") {
    return "取消无限";
  }

  return action;
}

function getAuditSummary(log: AuditLog) {
  if (!log.metadata || typeof log.metadata !== "object") {
    return log.targetId ?? "";
  }

  const metadata = log.metadata as {
    adminNickname?: string;
    targetAppUserId?: string;
    after?: { user?: { nickname?: string; appUserId?: string } };
  };
  const target =
    metadata.after?.user?.nickname ??
    metadata.after?.user?.appUserId ??
    metadata.targetAppUserId ??
    log.targetId ??
    "";

  return `${metadata.adminNickname ?? "管理员"} -> ${target}`;
}

export function GaokaoAdminConsole({
  admin,
  initialOverview,
  initialUsers,
  initialAuditLogs,
}: Props) {
  const [overview, setOverview] = useState(initialOverview);
  const [users, setUsers] = useState(initialUsers);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [selectedDetail, setSelectedDetail] = useState<UserDetail | null>(null);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const visibleUsers = useMemo(() => users, [users]);

  async function refresh(nextQuery = query) {
    setIsLoading(true);
    setNotice(null);

    try {
      const [meResponse, usersResponse, logsResponse] = await Promise.all([
        fetch(apiPath("/gaokao/admin/me"), { credentials: "include" }),
        fetch(
          `${apiPath("/gaokao/admin/users")}${
            nextQuery.trim() ? `?q=${encodeURIComponent(nextQuery.trim())}` : ""
          }`,
          { credentials: "include" },
        ),
        fetch(apiPath("/gaokao/admin/audit-logs"), { credentials: "include" }),
      ]);

      if (!meResponse.ok || !usersResponse.ok) {
        throw new Error("管理员状态已失效，请重新进入。");
      }

      const mePayload = (await meResponse.json()) as { overview: Overview };
      const usersPayload = (await usersResponse.json()) as {
        users: GaokaoAdminUserRow[];
      };
      setOverview(mePayload.overview);
      setUsers(usersPayload.users);

      if (logsResponse.ok) {
        const logsPayload = (await logsResponse.json()) as { logs: AuditLog[] };
        setAuditLogs(logsPayload.logs);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "刷新失败");
    } finally {
      setIsLoading(false);
    }
  }

  async function runUserAction(user: GaokaoAdminUserRow, action: string) {
    const labels: Record<string, string> = {
      "reset-generation": "重置生成机会",
      "enable-unlimited": "开启无限生成",
      "disable-unlimited": "取消无限生成",
    };

    if (!window.confirm(`确认给「${user.nickname}」${labels[action]}？`)) {
      return;
    }

    setIsLoading(true);
    setNotice(null);

    try {
      const response = await fetch(
        apiPath(`/gaokao/admin/users/${user.id}/${action}`),
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new Error(payload?.error?.message ?? "操作失败");
      }

      setNotice(`已${labels[action]}：${user.nickname}`);
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "操作失败");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUserDetail(user: GaokaoAdminUserRow) {
    setIsLoading(true);
    setNotice(null);

    try {
      const response = await fetch(apiPath(`/gaokao/admin/users/${user.id}`), {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("用户详情读取失败");
      }

      setSelectedDetail((await response.json()) as UserDetail);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "用户详情读取失败");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f8ff] text-[#101828]">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
        <header className="flex flex-col gap-3 border-b border-[#dbe7fb] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <a
              href={appPath("/gaokao")}
              className="inline-flex h-9 items-center gap-1 rounded-[8px] bg-white px-3 text-sm font-black text-[#1769e8] shadow-sm"
            >
              <ArrowLeft size={15} />
              返回助手
            </a>
            <h1 className="mt-3 text-2xl font-black tracking-normal">
              高考助手管理台
            </h1>
            <p className="mt-1 text-sm font-medium text-[#667085]">
              {admin.nickname} / App ID {admin.appUserId}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[#1769e8] px-4 text-sm font-black text-white disabled:bg-[#9dbff4]"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            刷新
          </button>
        </header>

        {notice ? (
          <div className="mt-3 rounded-[8px] border border-[#d8e4f8] bg-white px-3 py-2 text-sm font-bold text-[#344054]">
            {notice}
          </div>
        ) : null}

        <section className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Metric label="近 24 小时进入" value={overview.recentUsers} />
          <Metric label="累计用户" value={overview.totalUsers} />
          <Metric label="高考报告" value={overview.totalReports} />
          <Metric label="无限账号" value={overview.unlimitedUsers} />
        </section>

        <section className="mt-4 rounded-[8px] bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <UsersRound size={18} className="text-[#1769e8]" />
              <h2 className="text-base font-black">用户使用记录</h2>
            </div>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void refresh(query);
              }}
            >
              <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-[8px] border border-[#dbe7fb] px-3 sm:w-72">
                <Search size={16} className="shrink-0 text-[#667085]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="昵称或 App ID"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </label>
              <button
                type="submit"
                className="h-10 rounded-[8px] bg-[#101828] px-4 text-sm font-black text-white"
              >
                搜索
              </button>
            </form>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#eef2f7] text-xs font-black text-[#667085]">
                  <th className="py-2 pr-3">用户</th>
                  <th className="py-2 pr-3">最后进入</th>
                  <th className="py-2 pr-3">高考报告</th>
                  <th className="py-2 pr-3">其他生成</th>
                  <th className="py-2 pr-3">权限</th>
                  <th className="py-2 pr-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id} className="border-b border-[#f2f5fa]">
                    <td className="py-3 pr-3">
                      <p className="font-black text-[#101828]">{user.nickname}</p>
                      <p className="mt-1 text-xs font-bold text-[#667085]">
                        App ID {user.appUserId}
                      </p>
                    </td>
                    <td className="py-3 pr-3 text-[#475467]">
                      {formatTime(user.lastSeenAt)}
                    </td>
                    <td className="py-3 pr-3">
                      <p className="font-bold">
                        {user.gaokaoReports} 份 / 未删 {user.activeGaokaoReports}
                      </p>
                      <p className="mt-1 text-xs text-[#667085]">
                        已删 {user.deletedGaokaoReports}，最近{" "}
                        {formatTime(user.latestReportAt)}
                      </p>
                    </td>
                    <td className="py-3 pr-3 text-[#475467]">
                      写真 {user.photoTasks} / 算命 {user.fortuneTasks}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-flex h-7 items-center rounded-[8px] px-2 text-xs font-black ${
                          user.isUnlimited
                            ? "bg-[#eaf8ef] text-[#237a42]"
                            : "bg-[#f2f4f7] text-[#667085]"
                        }`}
                      >
                        {user.isUnlimited ? "无限生成" : user.canGenerate ? "可生成" : "已用完"}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap gap-2">
                        <ActionButton
                          label="详情"
                          icon={<Eye size={14} />}
                          onClick={() => void loadUserDetail(user)}
                        />
                        <ActionButton
                          label="重置"
                          icon={<RotateCcw size={14} />}
                          onClick={() => void runUserAction(user, "reset-generation")}
                        />
                        {user.isUnlimited && !user.isBuiltInAdmin ? (
                          <ActionButton
                            label="取消无限"
                            icon={<ShieldOff size={14} />}
                            onClick={() =>
                              void runUserAction(user, "disable-unlimited")
                            }
                          />
                        ) : (
                          <ActionButton
                            label="开无限"
                            icon={<ShieldCheck size={14} />}
                            disabled={user.isBuiltInAdmin && user.isUnlimited}
                            onClick={() =>
                              void runUserAction(user, "enable-unlimited")
                            }
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedDetail ? (
            <div className="mt-4 rounded-[8px] border border-[#dbe7fb] bg-[#f7faff] p-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-black">
                    {selectedDetail.user.nickname} 的高考报告记录
                  </h3>
                  <p className="mt-1 text-xs font-bold text-[#667085]">
                    App ID {selectedDetail.user.appUserId} / 报告{" "}
                    {selectedDetail.user.gaokaoReports} 份
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDetail(null)}
                  className="h-8 rounded-[8px] bg-white px-3 text-xs font-black text-[#1769e8]"
                >
                  收起
                </button>
              </div>

              {selectedDetail.reports.length === 0 ? (
                <p className="mt-3 text-sm text-[#667085]">暂无高考报告。</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {selectedDetail.reports.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-[8px] bg-white px-3 py-2 text-sm"
                    >
                      <p className="font-bold text-[#101828]">{report.title}</p>
                      <p className="mt-1 text-xs text-[#667085]">
                        {formatTime(report.createdAt)} /{" "}
                        {report.deletedAt ? "已删除" : "未删除"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </section>

        <section className="mt-4 rounded-[8px] bg-white p-3 shadow-sm">
          <h2 className="text-base font-black">最近管理操作</h2>
          {auditLogs.length === 0 ? (
            <p className="mt-2 text-sm text-[#667085]">暂无操作记录。</p>
          ) : (
            <div className="mt-2 space-y-2">
              {auditLogs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-1 rounded-[8px] bg-[#f7faff] px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-bold">
                    {getActionLabel(log.action)} · {getAuditSummary(log)}
                  </span>
                  <span className="text-xs font-bold text-[#667085]">
                    {formatTime(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[8px] bg-white p-3 shadow-sm">
      <p className="text-xs font-black text-[#667085]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#101828]">{value}</p>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1 rounded-[8px] bg-[#eaf2ff] px-2 text-xs font-black text-[#1769e8] disabled:bg-[#f2f4f7] disabled:text-[#98a2b3]"
    >
      {icon}
      {label}
    </button>
  );
}
