"use client";

import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

type Shortcut = {
  keys: string;
  description: string;
};

const SHORTCUTS: { group: string; items: Shortcut[] }[] = [
  {
    group: "导航",
    items: [
      { keys: "g h", description: "回首页" },
      { keys: "g p", description: "文章列表" },
      { keys: "g a", description: "归档" },
      { keys: "g t", description: "标签云" },
      { keys: "g s", description: "系列" },
      { keys: "g r", description: "随机一篇" },
      { keys: "g b", description: "书签" },
      { keys: "g d", description: "日记" },
      { keys: "g f", description: "友链" },
      { keys: "g i", description: "留言板" },
    ],
  },
  {
    group: "全局",
    items: [
      { keys: "⌘/Ctrl K", description: "打开命令面板" },
      { keys: "/", description: "聚焦搜索框" },
      { keys: "?", description: "显示这个帮助弹窗" },
      { keys: "Esc", description: "关闭弹窗" },
    ],
  },
];

const GOTO_MAP: Record<string, string> = {
  h: "/",
  p: "/posts",
  a: "/archive",
  t: "/tags",
  s: "/series",
  r: "/posts/random",
  b: "/bookmarks",
  d: "/diary",
  f: "/friends",
  i: "/guestbook",
};

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

export function KeyboardShortcuts() {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let gPressedAt = 0;

    function onKey(e: KeyboardEvent) {
      // Ignore when modifiers are involved (Cmd+K, Ctrl+R, etc.) so we don't
      // hijack the browser, except for plain "?" / "/" which we want.
      if (e.altKey || e.metaKey || e.ctrlKey) {
        return;
      }
      // Ignore when typing — except Escape, which closes help.
      if (isEditable(e.target)) {
        if (e.key === "Escape" && helpOpen) {
          e.preventDefault();
          setHelpOpen(false);
        }
        return;
      }

      // ? — help
      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }

      // / — focus search input on /search; else open /search page
      if (e.key === "/") {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>(
          'input[type="search"]',
        );
        if (input) {
          input.focus();
          input.select();
        } else {
          router.push("/search");
        }
        return;
      }

      if (e.key === "Escape" && helpOpen) {
        e.preventDefault();
        setHelpOpen(false);
        return;
      }

      // g <X> — go to page
      const key = e.key.toLowerCase();
      if (key === "g") {
        gPressedAt = Date.now();
        return;
      }
      if (gPressedAt && Date.now() - gPressedAt < 1500 && GOTO_MAP[key]) {
        e.preventDefault();
        gPressedAt = 0;
        router.push(GOTO_MAP[key]);
        return;
      }
      gPressedAt = 0;
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, helpOpen]);

  if (!mounted || !helpOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setHelpOpen(false);
      }}
    >
      <div className="absolute inset-0 bg-[var(--overlay-backdrop)] backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md overflow-hidden border border-border bg-card/94 shadow-[0_28px_90px_var(--shadow-heavy),0_0_48px_var(--accent-glow)] backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-border bg-card px-5 py-3">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">键盘快捷键</h3>
          <button
            onClick={() => setHelpOpen(false)}
            aria-label="关闭"
            className="border border-transparent px-2 py-1 text-xs text-muted-soft transition hover:border-border hover:bg-foreground/3 hover:text-accent"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-4 p-5">
          {SHORTCUTS.map((section) => (
            <section key={section.group}>
              <h4 className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-accent-soft">
                {section.group}
              </h4>
              <ul className="flex flex-col gap-1.5">
                {section.items.map((s) => (
                  <li
                    key={s.keys}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-foreground">{s.description}</span>
                    <span className="flex gap-1">
                      {s.keys.split(" ").map((k, i) => (
                        <kbd
                          key={i}
                          className="border border-border bg-card px-1.5 py-0.5 font-mono text-[11px] text-foreground"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="border-t border-border bg-card px-5 py-2 text-center text-[11px] text-muted-soft">
          按 ESC 关闭
        </div>
      </div>
    </div>,
    document.body,
  );
}
