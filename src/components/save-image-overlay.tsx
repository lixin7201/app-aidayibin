"use client";

import { useEffect } from "react";

import { ExternalLink, Loader2, RefreshCw, X } from "lucide-react";

import type { SaveImageState } from "@/lib/qfh5-actions";

type Props = {
  state: SaveImageState | null;
  onClose: () => void;
  onRetry: () => void;
};

export function SaveImageOverlay({ state, onClose, onRetry }: Props) {
  useEffect(() => {
    if (state?.stage === "success") {
      const timer = window.setTimeout(onClose, 1200);
      return () => window.clearTimeout(timer);
    }
  }, [state, onClose]);

  if (!state) {
    return null;
  }

  const isActive =
    state.stage === "preparing" || state.stage === "saving" || state.stage === "slow";
  const isFailed = state.stage === "failed";
  const isFallback = state.stage === "fallback";
  const isAppRequired = state.stage === "appRequired";
  const isSuccess = state.stage === "success";
  const successTitle = state.message.includes("长按") ? "已打开高清图" : "已保存到相册";

  return (
    <div
      className="fixed inset-0 z-[2147483646] flex items-end justify-center bg-black/60 p-4 sm:items-center"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isActive) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[400px] rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--chip-surface)]">
            {isSuccess ? (
              <span className="text-lg">✓</span>
            ) : isFailed || isFallback || isAppRequired ? (
              <span className="text-lg text-[#b64a3c]">!</span>
            ) : (
              <Loader2 size={18} className="animate-spin text-[var(--primary)]" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-[var(--foreground)]">
              {isSuccess
                ? successTitle
                : isAppRequired
                  ? "请在大宜宾 App 保存原图"
                  : isFailed || isFallback
                  ? "保存遇到问题"
                  : "正在保存图片"}
            </h3>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              {state.message}
            </p>
          </div>
          {!isActive && (
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--chip-surface)]"
              onClick={onClose}
              aria-label="关闭"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {isActive && (
          <div className="mt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--chip-surface)]">
              <div className="h-full w-full animate-[shimmer_1.5s_infinite] rounded-full bg-[var(--primary)] opacity-70" />
            </div>
            <p className="mt-2 text-[11px] font-bold text-[var(--muted)]">
              {state.stage === "slow"
                ? "请保持当前页面打开，完成后会自动提示"
                : "图片较大时需要多等一会儿，请不要重复点击"}
            </p>
          </div>
        )}

        {isAppRequired && (
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={state.appUrl}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--foreground)] px-3 text-xs font-black text-[var(--background)]"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={13} />
              下载/打开大宜宾 App
            </a>
            <button
              type="button"
              className="inline-flex h-9 items-center rounded-xl px-3 text-xs font-bold text-[var(--muted)]"
              onClick={onClose}
            >
              关闭
            </button>
          </div>
        )}

        {(isFailed || isFallback) && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--action-surface)] px-3 text-xs font-black text-[var(--primary)]"
              onClick={onRetry}
            >
              <RefreshCw size={13} />
              重试保存
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center rounded-xl px-3 text-xs font-bold text-[var(--muted)]"
              onClick={onClose}
            >
              关闭
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
