import Image from "next/image";
import { Camera, Hand, Smartphone } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { appPath } from "@/lib/routes";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-5xl flex-col justify-center">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/brand/dayibin-icon.png" alt="大宜宾" width={44} height={44} className="rounded-xl" />
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                大宜宾 AI Studio
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
            请选择要体验的 AI 功能
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            各功能页面独立运行。后续新增玩法也会统一在这里管理入口。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <a
            href={appPath("/photo")}
            className="group rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-[0_18px_50px_rgba(102,76,160,0.12)] transition hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(102,76,160,0.18)]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8d6bff] text-white">
              <Camera size={22} />
            </span>
            <h2 className="mt-5 text-2xl font-black">AI 写真</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              上传 1-4 张清晰单人照，选择模板生成写实风个人展示面大片。
            </p>
            <span className="mt-5 inline-flex text-sm font-black text-[var(--primary)]">
              进入 AI 写真
            </span>
          </a>

          <a
            href={appPath("/webview-test")}
            className="group rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-[0_18px_50px_rgba(102,76,160,0.12)] transition hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(102,76,160,0.18)]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1f9d8a] text-white">
              <Smartphone size={22} />
            </span>
            <h2 className="mt-5 text-2xl font-black">App 登录检测</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              专门用来测试 App WebView 是否注入了 QFH5.getUserInfo。
            </p>
            <span className="mt-5 inline-flex text-sm font-black text-[var(--primary)]">
              开始检测
            </span>
          </a>

          <a
            href={appPath("/fortune")}
            className="group rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-[0_18px_50px_rgba(85,54,22,0.10)] transition hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(85,54,22,0.14)]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#27362f] text-[#f6efd9]">
              <Hand size={22} />
            </span>
            <h2 className="mt-5 text-2xl font-black text-[var(--foreground)]">AI 算命</h2>
            <p className="mt-2 text-sm leading-6 text-[#6e6048]">
              上传清晰手掌照片，生成适合分享的掌纹命运走势报告图。
            </p>
            <span className="mt-5 inline-flex text-sm font-black text-[var(--accent)]">
              进入 AI 算命
            </span>
          </a>
        </div>
      </section>
    </main>
  );
}
