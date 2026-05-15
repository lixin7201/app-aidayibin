"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils/cn";

const STORAGE_KEY = "dayibin-theme";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored === "dark" || stored === "light") {
      return stored;
    }
  } catch {
    // Ignore storage errors in embedded WebViews.
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors in embedded WebViews.
    }
  }, [theme]);

  return (
    <button
      type="button"
      aria-label={theme === "dark" ? "切换到白天模式" : "切换到夜间模式"}
      title={theme === "dark" ? "切换到白天模式" : "切换到夜间模式"}
      onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-sm backdrop-blur transition",
        theme === "dark"
          ? "border-white/15 bg-white/10 text-white hover:bg-white/15"
          : "border-black/10 bg-white text-[#201b3d] hover:bg-[#f3efff]",
      )}
    >
      {theme === "dark" ? <SunMedium size={18} /> : <MoonStar size={18} />}
    </button>
  );
}
