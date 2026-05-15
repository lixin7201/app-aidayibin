"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiPath, appPath } from "@/lib/routes";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submit() {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(apiPath("/admin/login"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const payload = await response.json();
        setMessage(payload.error?.message ?? "登录失败");
        return;
      }

      router.push(appPath("/admin"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6f3] px-4">
      <div className="w-full max-w-md rounded-[8px] bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#8a6f45]">
          Admin Login
        </p>
        <h1 className="mt-2 text-2xl font-semibold">大宜宾 AI 能力平台后台</h1>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">用户名</span>
            <input
              className="h-11 w-full rounded-[8px] border border-black/10 px-3 outline-none"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">密码</span>
            <input
              type="password"
              className="h-11 w-full rounded-[8px] border border-black/10 px-3 outline-none"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {message ? (
            <div className="rounded-[8px] bg-[#f7f3ea] px-3 py-2 text-sm text-[#6c716e]">
              {message}
            </div>
          ) : null}

          <button
            className="h-11 w-full rounded-[8px] bg-[#1f2523] text-sm font-semibold text-white disabled:opacity-60"
            onClick={() => void submit()}
            disabled={isLoading}
          >
            {isLoading ? "登录中..." : "登录后台"}
          </button>
        </div>
      </div>
    </main>
  );
}
