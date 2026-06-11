"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  ListChecks,
  NotebookPen,
  Timer,
} from "lucide-react";

const TABS = [
  { path: "", label: "首页", Icon: LayoutDashboard },
  { path: "/flashcards", label: "背单词", Icon: Layers },
  { path: "/mistakes", label: "错题本", Icon: NotebookPen },
  { path: "/timer", label: "计时", Icon: Timer },
  { path: "/quiz", label: "题库", Icon: ListChecks },
] as const;

export function ToolsTabBar({ base }: { base: string }) {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto grid w-full max-w-2xl grid-cols-5">
        {TABS.map(({ path, label, Icon }) => {
          const href = base + path || "/";
          const active =
            path === ""
              ? pathname === href
              : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={label}
              href={href}
              className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-1 py-2 text-xs transition-colors ${
                active ? "text-accent" : "text-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
