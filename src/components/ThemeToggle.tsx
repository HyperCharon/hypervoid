"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "@/components/LocaleProvider";

const THEMES = ["dark", "light", "cyberpunk"] as const;
type Theme = (typeof THEMES)[number];

const THEME_ICONS: Record<Theme, typeof Moon> = {
  dark: Moon,
  light: Sun,
  cyberpunk: Zap,
};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useT();

  useEffect(() => setMounted(true), []);

  const current: Theme = THEMES.includes(resolvedTheme as Theme)
    ? (resolvedTheme as Theme)
    : "dark";
  const idx = THEMES.indexOf(current);
  const next = THEMES[(idx + 1) % THEMES.length];
  const Icon = THEME_ICONS[current];

  const nextLabel: Record<Theme, string> = {
    dark: t.common.themeDark,
    light: t.common.themeLight,
    cyberpunk: t.common.themeCyberpunk,
  };

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`${t.common.toggleTheme} → ${nextLabel[next]}`}
      title={`${t.common.toggleTheme} → ${nextLabel[next]}`}
      className="grid h-10 w-10 place-items-center border border-border bg-card text-muted backdrop-blur-xl transition hover:border-border hover:bg-card-hover hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent touch-manipulation"
    >
      {mounted ? <Icon className="h-4 w-4" aria-hidden /> : <Sun className="h-4 w-4" aria-hidden />}
    </button>
  );
}
