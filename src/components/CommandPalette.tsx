"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CommandIndexItem } from "@/lib/command-index";

const PAGES: { title: string; href: string; hint?: string }[] = [
  { title: "首页", href: "/", hint: "Home" },
  { title: "文章", href: "/posts", hint: "Posts" },
  { title: "归档", href: "/archive", hint: "Archive" },
  { title: "标签", href: "/tags", hint: "Tags" },
  { title: "系列", href: "/series", hint: "Series" },
  { title: "置顶文章", href: "/pinned", hint: "Pinned" },
  { title: "随机一篇", href: "/posts/random", hint: "Random" },
  { title: "搜索", href: "/search", hint: "Full search" },
  { title: "番剧", href: "/anime" },
  { title: "游戏", href: "/games" },
  { title: "书籍", href: "/books" },
  { title: "影视", href: "/movies" },
  { title: "相册", href: "/albums" },
  { title: "日记", href: "/diary" },
  { title: "时间线", href: "/timeline" },
  { title: "项目", href: "/projects" },
  { title: "技能", href: "/skills" },
  { title: "书签", href: "/bookmarks" },
  { title: "留言板", href: "/guestbook" },
  { title: "友链", href: "/friends" },
  { title: "关于", href: "/about" },
  { title: "订阅", href: "/subscribe" },
];

type Item = {
  type: "page" | "post" | "tag" | "series" | "search";
  title: string;
  href: string;
  hint?: string;
  score: number;
};

function score(query: string, target: string): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t === q) return 1000;
  if (t.startsWith(q)) return 500 - (t.length - q.length);
  const idx = t.indexOf(q);
  if (idx >= 0) return 200 - idx;
  // Sub-sequence match for fuzzy fallback
  let qi = 0;
  let matchedAt = -1;
  let lastIdx = -1;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      if (matchedAt < 0) matchedAt = i;
      lastIdx = i;
      qi++;
    }
  }
  if (qi === q.length) {
    return Math.max(1, 100 - (lastIdx - matchedAt));
  }
  return 0;
}

export function CommandPalette({ index }: { index: CommandIndexItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const all: Item[] = useMemo(() => {
    const allItems: Item[] = [
      ...PAGES.map((p) => ({
        type: "page" as const,
        title: p.title,
        href: p.href,
        hint: p.hint,
        score: 0,
      })),
      ...index.map((i) => ({ ...i, score: 0 })),
    ];
    return allItems;
  }, [index]);

  const filtered: Item[] = useMemo(() => {
    if (!query.trim()) {
      // Show pages first when no query — natural starting set
      return all.filter((i) => i.type === "page").slice(0, 20);
    }
    const q = query.trim();
    const ranked = all
      .map((i) => {
        const titleScore = score(q, i.title);
        const hintScore = i.hint ? score(q, i.hint) * 0.5 : 0;
        return { ...i, score: Math.max(titleScore, hintScore) };
      })
      .filter((i) => i.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);

    // Append a "search the rest" affordance at the bottom
    ranked.push({
      type: "search",
      title: `在全站搜索「${q}」`,
      href: `/search?q=${encodeURIComponent(q)}`,
      hint: "回车 / Enter",
      score: -1,
    });
    return ranked;
  }, [all, query]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  useEffect(() => {
    if (cursor < 0 || cursor >= filtered.length) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-cmd-index="${cursor}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor, filtered.length]);

  const go = useCallback(
    (item: Item) => {
      setOpen(false);
      router.push(item.href);
    },
    [router],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(filtered.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[cursor];
      if (item) go(item);
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="absolute inset-0 bg-[var(--overlay-backdrop)] backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-xl overflow-hidden border border-border bg-card/94 shadow-[0_28px_90px_var(--shadow-heavy),0_0_48px_var(--accent-glow)] backdrop-blur-2xl">
        <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-accent-soft" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="搜索页面、文章、标签或系列…"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-soft"
            aria-label="命令面板搜索"
          />
          <kbd className="hidden font-mono text-xs text-muted-soft sm:inline">
            ESC
          </kbd>
        </div>
        <div
          ref={listRef}
          className="max-h-[50vh] overflow-y-auto p-1.5"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-soft">
              没有匹配。试试别的关键词。
            </p>
          ) : (
            <>
              {groupByType(filtered).map(([type, items]) => (
                <section key={type} className="mb-1">
                  <h4 className="px-3 pt-2 pb-1 font-mono text-xs font-semibold uppercase tracking-widest text-accent-soft">
                    {LABEL[type]}
                  </h4>
                  {items.map(({ item, gi }) => {
                    const active = gi === cursor;
                    return (
                      <button
                        key={`${item.type}-${item.href}`}
                        data-cmd-index={gi}
                        onMouseEnter={() => setCursor(gi)}
                        onClick={() => go(item)}
                        role="option"
                        aria-selected={active}
                        className={`flex w-full items-center justify-between gap-3 border border-transparent px-3 py-2 text-left text-sm transition ${
                          active
                            ? "border-border bg-accent/10 text-foreground"
                            : "text-muted hover:border-border hover:bg-card hover:text-foreground"
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span aria-hidden className="text-base leading-none">
                            {ICON[item.type]}
                          </span>
                          <span className="truncate">{item.title}</span>
                        </span>
                        <span className="shrink-0 font-mono text-[11px] text-muted-soft">
                          {item.hint ?? ""}
                        </span>
                      </button>
                    );
                  })}
                </section>
              ))}
            </>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border bg-card px-4 py-2 text-[11px] text-muted-soft">
          <span className="flex items-center gap-3">
            <kbd className="font-mono">↑↓</kbd> 移动
            <kbd className="font-mono">Enter</kbd> 打开
          </span>
          <span>{filtered.length} 项</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const LABEL: Record<Item["type"], string> = {
  page: "页面",
  post: "文章",
  tag: "标签",
  series: "系列",
  search: "更多",
};

const ICON: Record<Item["type"], string> = {
  page: "→",
  post: "✦",
  tag: "#",
  series: "❅",
  search: "⌕",
};

function groupByType(
  items: Item[],
): [Item["type"], { item: Item; gi: number }[]][] {
  const order: Item["type"][] = ["page", "post", "tag", "series", "search"];
  const groups = new Map<Item["type"], { item: Item; gi: number }[]>();
  items.forEach((item, gi) => {
    const arr = groups.get(item.type) ?? [];
    arr.push({ item, gi });
    groups.set(item.type, arr);
  });
  return order
    .map(
      (t): [Item["type"], { item: Item; gi: number }[]] => [
        t,
        groups.get(t) ?? [],
      ],
    )
    .filter(([, arr]) => arr.length > 0);
}
