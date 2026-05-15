"use client";

import { useEffect, useState } from "react";

type TestStatus = "checking" | "success" | "missing" | "failed";

type QFH5UserInfo = {
  uid?: string | number;
  username?: string;
  face?: string;
  deviceid?: string;
  [key: string]: unknown;
};

type QFH5Bridge = {
  getUserInfo?: (
    callback: (state: number | string, data?: QFH5UserInfo) => void,
  ) => void;
};

declare global {
  interface Window {
    QFH5?: QFH5Bridge;
  }
}

export default function WebviewTestPage() {
  const [status, setStatus] = useState<TestStatus>("checking");
  const [message, setMessage] = useState("正在检测 App 是否注入 QFH5.getUserInfo...");
  const [result, setResult] = useState<unknown>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const getUserInfo = window.QFH5?.getUserInfo;

      if (typeof getUserInfo !== "function") {
        setStatus("missing");
        setMessage("没有检测到 QFH5.getUserInfo。说明当前页面可能不是在 App WebView 内打开，或者 App 还没有注入登录方法。");
        setResult({ QFH5: typeof window.QFH5, getUserInfo: typeof getUserInfo });
        return;
      }

      try {
        getUserInfo((state, data) => {
          setResult({ state, data });

          if (String(state) === "1") {
            setStatus("success");
            setMessage("检测成功：App 已经返回用户信息。");
            return;
          }

          setStatus("failed");
          setMessage("检测到 QFH5.getUserInfo，但 App 返回未登录或失败。");
        });
      } catch (error) {
        setStatus("failed");
        setMessage("调用 QFH5.getUserInfo 时出错。");
        setResult(error instanceof Error ? error.message : String(error));
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, []);

  const statusText = {
    checking: "检测中",
    success: "成功",
    missing: "未检测到",
    failed: "失败",
  }[status];

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-[var(--foreground)]">
      <section className="mx-auto flex min-h-[calc(100vh-48px)] max-w-3xl flex-col justify-center">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[0_18px_50px_rgba(102,76,160,0.12)]">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            App WebView 测试页
          </p>
          <h1 className="mt-3 text-3xl font-black">QFH5.getUserInfo 检测</h1>
          <div className="mt-5 rounded-2xl bg-[#f5f0ff] p-4">
            <p className="text-sm font-black text-[var(--primary)]">当前状态：{statusText}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{message}</p>
          </div>

          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <p className="text-sm font-black">返回内容</p>
            <pre className="mt-3 max-h-[360px] overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-[var(--muted)]">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>

          <div className="mt-5 rounded-2xl bg-[#fbfaff] p-4 text-sm leading-6 text-[var(--muted)]">
            <p className="font-black text-[var(--foreground)]">怎么看结果：</p>
            <p className="mt-2">如果显示“成功”，说明 App 已经把用户信息传给 H5。</p>
            <p>如果显示“未检测到”，说明 App 没有注入 QFH5.getUserInfo，或者页面不是在 App WebView 里打开。</p>
            <p>如果显示“失败”，说明方法存在，但 App 返回了未登录或错误。</p>
          </div>
        </div>
      </section>
    </main>
  );
}
