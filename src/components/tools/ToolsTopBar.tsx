"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Settings, Sun } from "lucide-react";

function countdownLabel(daysLeft: number): string {
  if (daysLeft > 0) return `距初试 ${daysLeft} 天`;
  if (daysLeft === 0) return "初试就在今天";
  return "已开考";
}

export function ToolsTopBar({
  base,
  daysLeft,
}: {
  base: string;
  daysLeft: number | null;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-4">
        <Link href={base || "/"} className="flex items-center gap-2">
          <span className="font-display text-sm font-semibold tracking-wide">
            考研工具
          </span>
          {daysLeft !== null && (
            <span className="rounded-full bg-accent-glow px-2 py-0.5 text-xs font-medium text-accent">
              {countdownLabel(daysLeft)}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href={`${base}/settings`}
            aria-label="设置"
            className="rounded-lg p-2 text-muted transition-colors hover:bg-card-hover hover:text-foreground"
          >
            <Settings className="h-5 w-5" aria-hidden />
          </Link>
          <button
            type="button"
            aria-label="切换主题"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-card-hover hover:text-foreground"
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="h-5 w-5" aria-hidden />
            ) : (
              <Moon className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
