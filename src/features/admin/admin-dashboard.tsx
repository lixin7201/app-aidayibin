"use client";

import {
  BarChart3,
  LogOut,
  Download,
  Eye,
  ImagePlus,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { useEffect, useState } from "react";

import type {
  FortuneGenerationTaskRecord,
  GenerationTaskRecord,
} from "@/lib/db/database.types";
import { apiPath, appPath } from "@/lib/routes";
import type { PhotoTemplate } from "@/features/templates/types";

type DashboardPayload = {
  metrics: {
    todaySubmitted: number;
    todaySucceeded: number;
    todayFailed: number;
    fortuneTodaySubmitted: number;
    fortuneTodaySucceeded: number;
    fortunePalmSubmitted: number;
    fortuneFaceSubmitted: number;
    activeUsers: number;
    successRate: number;
  };
  limits: {
    dailySuccessLimitPerUser: number;
    campaignSuccessLimitPerUser: number;
    dailySubmitLimitPerUser: number;
    dailyPlatformSuccessLimit: number;
    featureEnabled: boolean;
  };
  fortuneLimits: {
    dailySuccessLimitPerUser: number;
    campaignSuccessLimitPerUser: number;
    dailySubmitLimitPerUser: number;
    dailyPlatformSuccessLimit: number;
    featureEnabled: boolean;
    palmEnabled: boolean;
    faceEnabled: boolean;
  };
  topTemplates: Array<{ name: string; count: number }>;
};

type Props = {
  initialDashboard: DashboardPayload;
  initialTemplates: PhotoTemplate[];
  initialGenerations: GenerationTaskRecord[];
  initialFortuneGenerations: FortuneGenerationTaskRecord[];
};

export function AdminDashboard({
  initialDashboard,
  initialTemplates,
  initialGenerations,
  initialFortuneGenerations,
}: Props) {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [templates, setTemplates] = useState(initialTemplates);
  const [generations, setGenerations] = useState(initialGenerations);
  const [fortuneGenerations, setFortuneGenerations] = useState(
    initialFortuneGenerations,
  );

  async function refresh() {
    const [dashboardResponse, templatesResponse, generationsResponse] =
      await Promise.all([
        fetch(apiPath("/admin/dashboard")),
        fetch(apiPath("/admin/templates")),
        fetch(apiPath("/admin/generations")),
      ]);

    if (dashboardResponse.ok) {
      setDashboard(await dashboardResponse.json());
    }

    if (templatesResponse.ok) {
      const payload = (await templatesResponse.json()) as {
        templates: PhotoTemplate[];
      };
      setTemplates(payload.templates);
    }

    if (generationsResponse.ok) {
      const payload = (await generationsResponse.json()) as {
        generations: GenerationTaskRecord[];
        fortune_generations: FortuneGenerationTaskRecord[];
      };
      setGenerations(payload.generations);
      setFortuneGenerations(payload.fortune_generations);
    }
  }

  async function seedTemplates() {
    await fetch(apiPath("/admin/templates"), { method: "POST" });
    await refresh();
  }

  useEffect(() => {
    const timer = setInterval(() => void refresh(), 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-[#f5f6f3] text-[#1f2523]">
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <header className="flex flex-col justify-between gap-4 border-b border-black/8 pb-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#8a6f45]">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              大宜宾 AI 能力平台后台
            </h1>
          </div>
          <div className="flex gap-2">
            <a
              href={apiPath("/admin/export")}
              className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-white px-4 text-sm font-semibold shadow-sm"
            >
              <Download size={17} />
              导出 CSV
            </a>
            <button
              className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-[#1f2523] px-4 text-sm font-semibold text-white"
              onClick={() => void refresh()}
            >
              <RefreshCw size={17} />
              刷新
            </button>
            <button
              className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-white px-4 text-sm font-semibold shadow-sm"
              onClick={async () => {
                await fetch(apiPath("/admin/logout"), { method: "POST" });
                window.location.href = appPath("/admin/login");
              }}
            >
              <LogOut size={17} />
              退出
            </button>
          </div>
        </header>

        <section className="mt-6 grid gap-3 md:grid-cols-5">
          <MetricCard
            label="今日提交"
            value={dashboard.metrics.todaySubmitted}
            icon={<BarChart3 size={18} />}
          />
          <MetricCard
            label="今日成功"
            value={dashboard.metrics.todaySucceeded}
            icon={<ImagePlus size={18} />}
          />
          <MetricCard
            label="今日失败"
            value={dashboard.metrics.todayFailed}
            icon={<Eye size={18} />}
          />
          <MetricCard
            label="活跃用户"
            value={dashboard.metrics.activeUsers}
            icon={<BarChart3 size={18} />}
          />
          <MetricCard
            label="成功率"
            value={`${dashboard.metrics.successRate}%`}
            icon={<BarChart3 size={18} />}
          />
        </section>

        <section className="mt-3 grid gap-3 md:grid-cols-4">
          <MetricCard
            label="AI 算命提交"
            value={dashboard.metrics.fortuneTodaySubmitted}
            icon={<BarChart3 size={18} />}
          />
          <MetricCard
            label="AI 算命成功"
            value={dashboard.metrics.fortuneTodaySucceeded}
            icon={<ImagePlus size={18} />}
          />
          <MetricCard
            label="AI 看手相"
            value={dashboard.metrics.fortunePalmSubmitted}
            icon={<Eye size={18} />}
          />
          <MetricCard
            label="AI 看面相"
            value={dashboard.metrics.fortuneFaceSubmitted}
            icon={<Eye size={18} />}
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-[8px] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">模板管理</h2>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#f1eadf] px-3 text-sm font-semibold"
                onClick={() => void seedTemplates()}
              >
                <Settings2 size={16} />
                写入默认模板
              </button>
            </div>
            <div className="overflow-hidden rounded-[8px] border border-black/6">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f5f6f3] text-[#65706a]">
                  <tr>
                    <th className="px-3 py-3">排序</th>
                    <th className="px-3 py-3">名称</th>
                    <th className="px-3 py-3">分类</th>
                    <th className="px-3 py-3">比例</th>
                    <th className="px-3 py-3">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={template.id} className="border-t border-black/6">
                      <td className="px-3 py-3">{template.sortOrder}</td>
                      <td className="px-3 py-3 font-medium">{template.name}</td>
                      <td className="px-3 py-3">{template.category}</td>
                      <td className="px-3 py-3">
                        {template.supportedRatios.join(" / ")}
                      </td>
                      <td className="px-3 py-3">
                        {template.isActive ? "上线" : "下线"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[8px] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">当前限量</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <LimitRow
                  label="每人每日成功"
                  value={`${dashboard.limits.dailySuccessLimitPerUser} 张`}
                />
                <LimitRow
                  label="每人活动总成功"
                  value={`${dashboard.limits.campaignSuccessLimitPerUser} 张`}
                />
                <LimitRow
                  label="每人每日提交"
                  value={`${dashboard.limits.dailySubmitLimitPerUser} 次`}
                />
                <LimitRow
                  label="平台每日成功"
                  value={`${dashboard.limits.dailyPlatformSuccessLimit} 张`}
                />
                <LimitRow
                  label="功能开关"
                  value={dashboard.limits.featureEnabled ? "开启" : "关闭"}
                />
              </dl>
            </div>

            <div className="rounded-[8px] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">AI 算命配置</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <LimitRow
                  label="每人每日成功"
                  value={`${dashboard.fortuneLimits.dailySuccessLimitPerUser} 张`}
                />
                <LimitRow
                  label="每人活动总成功"
                  value={`${dashboard.fortuneLimits.campaignSuccessLimitPerUser} 张`}
                />
                <LimitRow
                  label="每人每日提交"
                  value={`${dashboard.fortuneLimits.dailySubmitLimitPerUser} 次`}
                />
                <LimitRow
                  label="总开关"
                  value={dashboard.fortuneLimits.featureEnabled ? "开启" : "关闭"}
                />
                <LimitRow
                  label="手相开关"
                  value={dashboard.fortuneLimits.palmEnabled ? "开启" : "关闭"}
                />
                <LimitRow
                  label="面相开关"
                  value={dashboard.fortuneLimits.faceEnabled ? "开启" : "关闭"}
                />
              </dl>
            </div>

            <div className="rounded-[8px] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">热门模板</h2>
              <div className="mt-4 space-y-3">
                {dashboard.topTemplates.length === 0 ? (
                  <p className="text-sm text-[#65706a]">暂无成功生成数据。</p>
                ) : (
                  dashboard.topTemplates.map((template) => (
                    <LimitRow
                      key={template.name}
                      label={template.name}
                      value={`${template.count}`}
                    />
                  ))
                )}
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-6 rounded-[8px] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">AI 算命最近记录</h2>
          <div className="mt-4 overflow-hidden rounded-[8px] border border-black/6">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f5f6f3] text-[#65706a]">
                <tr>
                  <th className="px-3 py-3">任务</th>
                  <th className="px-3 py-3">功能</th>
                  <th className="px-3 py-3">状态</th>
                  <th className="px-3 py-3">规格</th>
                  <th className="px-3 py-3">时间</th>
                  <th className="px-3 py-3">错误</th>
                </tr>
              </thead>
              <tbody>
                {fortuneGenerations.map((task) => (
                  <tr key={task.id} className="border-t border-black/6">
                    <td className="max-w-[180px] truncate px-3 py-3">
                      {task.id}
                    </td>
                    <td className="px-3 py-3">
                      {task.fortune_type === "palm" ? "AI 看手相" : "AI 看面相"}
                    </td>
                    <td className="px-3 py-3">{task.status}</td>
                    <td className="px-3 py-3">
                      {task.ratio} · {task.resolution}
                    </td>
                    <td className="px-3 py-3">
                      {new Date(task.created_at).toLocaleString("zh-CN")}
                    </td>
                    <td className="max-w-[240px] truncate px-3 py-3">
                      {task.error_message ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 rounded-[8px] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">最近生成记录</h2>
          <div className="mt-4 overflow-hidden rounded-[8px] border border-black/6">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f5f6f3] text-[#65706a]">
                <tr>
                  <th className="px-3 py-3">任务</th>
                  <th className="px-3 py-3">用户</th>
                  <th className="px-3 py-3">状态</th>
                  <th className="px-3 py-3">比例</th>
                  <th className="px-3 py-3">时间</th>
                  <th className="px-3 py-3">错误</th>
                </tr>
              </thead>
              <tbody>
                {generations.map((task) => (
                  <tr key={task.id} className="border-t border-black/6">
                    <td className="max-w-[180px] truncate px-3 py-3">
                      {task.id}
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-3">
                      {task.user_id}
                    </td>
                    <td className="px-3 py-3">{task.status}</td>
                    <td className="px-3 py-3">{task.ratio}</td>
                    <td className="px-3 py-3">
                      {new Date(task.created_at).toLocaleString("zh-CN")}
                    </td>
                    <td className="max-w-[240px] truncate px-3 py-3">
                      {task.error_message ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[8px] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-[#8a6f45]">
        <p className="text-sm">{label}</p>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function LimitRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[#65706a]">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
