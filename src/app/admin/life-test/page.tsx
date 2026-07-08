import { redirect } from "next/navigation";

import { getAdminSessionFromCookies } from "@/features/admin/admin-session";
import {
  getLifeTestAdminStats,
  listLifeTestAdminLeads,
  listLifeTestAdminSessions,
} from "@/features/life-test/life-test-service";
import { appPath } from "@/lib/routes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLifeTestPage() {
  const session = await getAdminSessionFromCookies();

  if (!session) {
    redirect(appPath("/admin/login"));
  }

  const [stats, sessions, leads] = await Promise.all([
    getLifeTestAdminStats(),
    listLifeTestAdminSessions(),
    listLifeTestAdminLeads(),
  ]);

  return (
    <main className="min-h-screen bg-[#f5f6f3] text-[#1f2523]">
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <header className="flex flex-col gap-3 border-b border-black/8 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0F766E]">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              宜宾人生搭子测试后台
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={appPath("/api/admin/life-test/export")}
              className="inline-flex h-10 items-center rounded-[8px] bg-[#0F766E] px-4 text-sm font-semibold text-white shadow-sm"
            >
              导出测试记录
            </a>
            <a
              href={appPath("/api/admin/life-test/export?type=leads")}
              className="inline-flex h-10 items-center rounded-[8px] bg-white px-4 text-sm font-semibold shadow-sm"
            >
              导出留资
            </a>
            <a
              href={appPath("/admin")}
              className="inline-flex h-10 items-center rounded-[8px] bg-white px-4 text-sm font-semibold shadow-sm"
            >
              返回总后台
            </a>
          </div>
        </header>

        <section className="mt-6 grid gap-3 md:grid-cols-4">
          <Metric label="今日访问" value={stats.todayPv} />
          <Metric label="今日开始" value={stats.todaySessions} />
          <Metric label="今日完成" value={stats.todayCompleted} />
          <Metric label="完成率" value={`${stats.completionRate}%`} />
          <Metric label="今日留资" value={stats.todayLeads} />
          <Metric label="保存海报" value={stats.todayPosterSaves} />
          <Metric label="分享点击" value={stats.todayShares} />
          <Metric label="招聘点击" value={stats.todayJobClicks} />
          <Metric label="红娘点击" value={stats.todayMatchmakerClicks} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="rounded-[8px] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">结果分布</h2>
            <div className="mt-4 grid gap-2">
              {stats.resultDistribution.length === 0 ? (
                <p className="text-sm text-[#65706a]">暂无完成数据。</p>
              ) : (
                stats.resultDistribution.map((item) => (
                  <div
                    key={item.resultCode ?? "unknown"}
                    className="flex items-center justify-between rounded-[8px] bg-[#f5f6f3] px-3 py-2 text-sm"
                  >
                    <span className="font-semibold">{item.resultName}</span>
                    <span>{item.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <aside className="rounded-[8px] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">结果类型池</h2>
            <div className="mt-4 grid gap-2">
              {stats.resultTypes.map((item) => (
                <div key={item.code} className="text-sm">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-[#65706a]">{item.keywords.join(" / ")}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-6 rounded-[8px] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">近 7 日趋势</h2>
          <div className="mt-4 overflow-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#f5f6f3] text-[#65706a]">
                <tr>
                  <th className="px-3 py-3">日期</th>
                  <th className="px-3 py-3">访问</th>
                  <th className="px-3 py-3">开始</th>
                  <th className="px-3 py-3">完成</th>
                  <th className="px-3 py-3">保存</th>
                  <th className="px-3 py-3">分享</th>
                  <th className="px-3 py-3">招聘</th>
                  <th className="px-3 py-3">红娘</th>
                  <th className="px-3 py-3">留资</th>
                </tr>
              </thead>
              <tbody>
                {stats.sevenDayTrend.map((item) => (
                  <tr key={item.date} className="border-t border-black/6">
                    <td className="px-3 py-3 font-semibold">{item.date}</td>
                    <td className="px-3 py-3">{item.views}</td>
                    <td className="px-3 py-3">{item.starts}</td>
                    <td className="px-3 py-3">{item.completes}</td>
                    <td className="px-3 py-3">{item.saves}</td>
                    <td className="px-3 py-3">{item.shares}</td>
                    <td className="px-3 py-3">{item.jobClicks}</td>
                    <td className="px-3 py-3">{item.matchmakerClicks}</td>
                    <td className="px-3 py-3">{item.leads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 rounded-[8px] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">最近测试记录</h2>
          <div className="mt-4 overflow-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-[#f5f6f3] text-[#65706a]">
                <tr>
                  <th className="px-3 py-3">时间</th>
                  <th className="px-3 py-3">用户</th>
                  <th className="px-3 py-3">状态</th>
                  <th className="px-3 py-3">结果</th>
                  <th className="px-3 py-3">分享</th>
                  <th className="px-3 py-3">招聘</th>
                  <th className="px-3 py-3">红娘</th>
                  <th className="px-3 py-3">来源</th>
                  <th className="px-3 py-3">重复标记</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((item) => (
                  <tr key={item.id} className="border-t border-black/6">
                    <td className="px-3 py-3">{formatTime(item.createdAt)}</td>
                    <td className="px-3 py-3">{item.nickname ?? "游客"}</td>
                    <td className="px-3 py-3">{item.status}</td>
                    <td className="px-3 py-3">{item.result?.name ?? "-"}</td>
                    <td className="px-3 py-3">{item.shareCount}</td>
                    <td className="px-3 py-3">{item.jobCtaClicks}</td>
                    <td className="px-3 py-3">{item.matchCtaClicks}</td>
                    <td className="px-3 py-3">{item.source ?? "-"}</td>
                    <td className="px-3 py-3">{item.repeatHigh ? "是" : "否"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 rounded-[8px] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">留资线索</h2>
          <div className="mt-4 overflow-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-[#f5f6f3] text-[#65706a]">
                <tr>
                  <th className="px-3 py-3">时间</th>
                  <th className="px-3 py-3">类型</th>
                  <th className="px-3 py-3">称呼</th>
                  <th className="px-3 py-3">手机</th>
                  <th className="px-3 py-3">微信</th>
                  <th className="px-3 py-3">结果</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-t border-black/6">
                    <td className="px-3 py-3">{formatTime(lead.createdAt)}</td>
                    <td className="px-3 py-3">{lead.leadType}</td>
                    <td className="px-3 py-3">{lead.name ?? "-"}</td>
                    <td className="px-3 py-3">{lead.mobile ?? "-"}</td>
                    <td className="px-3 py-3">{lead.wechat ?? "-"}</td>
                    <td className="px-3 py-3">{lead.resultName ?? "-"}</td>
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

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[8px] bg-white p-4 shadow-sm">
      <p className="text-sm text-[#65706a]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
