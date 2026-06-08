"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Eye,
  Heart,
  Mail,
  Megaphone,
  MessageCircle,
  PenLine,
  type LucideIcon,
} from "lucide-react";
import { createPortal } from "react-dom";
import type { Notification } from "@/lib/notifications-shared";

const READ_KEY = "hypervoid:notif:read-ids";

const ICON_BY_TYPE: Record<Notification["type"], LucideIcon> = {
  announcement: Megaphone,
  "new-post": PenLine,
  like: Heart,
  view: Eye,
  "comment-link": MessageCircle,
  guestbook: MessageCircle,
  subscriber: Mail,
};

function loadReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return new Set(arr);
  } catch {
    // ignore
  }
  return new Set();
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

function timeAgo(iso: string): string {
  const ts = new Date(iso).getTime();
  const diff = Date.now() - ts;
  if (Number.isNaN(diff)) return "";
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "刚刚";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} 天前`;
  const week = Math.floor(day / 7);
  if (week < 5) return `${week} 周前`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month} 个月前`;
  return `${Math.floor(day / 365)} 年前`;
}

type ApiResponse = {
  isAdmin: boolean;
  notifications: Notification[];
};

export function NotificationBell({ triggerClassName }: { triggerClassName?: string } = {}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    setReadIds(loadReadIds());
  }, []);

  // Fetch on mount + every 2 minutes
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/notifications", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as ApiResponse;
        if (alive) setData(json);
      } catch {
        // network error — silent, no notifications shown
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    const id = window.setInterval(load, 120_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const notifications = useMemo(() => data?.notifications ?? [], [data?.notifications]);
  const isAdmin = data?.isAdmin ?? false;

  useEffect(() => {
    if (!open || notifications.length === 0) return;
    const next = new Set(readIds);
    let changed = false;
    for (const n of notifications) {
      if (!next.has(n.id)) {
        next.add(n.id);
        changed = true;
      }
    }
    if (changed) {
      setReadIds(next);
      saveReadIds(next);
    }
  }, [open, notifications, readIds]);

  const unreadCount = useMemo(() => {
    let c = 0;
    for (const n of notifications) {
      if (!readIds.has(n.id)) c++;
    }
    return c;
  }, [notifications, readIds]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (triggerRef.current?.contains(e.target as Node)) return;
      const panel = document.getElementById("hv-notif-panel");
      if (panel?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const onClearAll = () => {
    const all = new Set(notifications.map((n) => n.id));
    setReadIds(all);
    saveReadIds(all);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="消息"
        title={`消息${unreadCount > 0 ? ` (${unreadCount} 未读)` : ""}`}
        className={triggerClassName ?? "relative inline-flex h-9 w-9 items-center justify-center border border-border bg-card text-accent-soft backdrop-blur-sm transition hover:border-accent/40 hover:bg-card-hover hover:text-accent"}
      >
        <Bell className="h-4 w-4" aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center border border-accent/40 bg-foreground px-1 font-mono text-xs font-bold text-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {mounted && open
        ? createPortal(
            <div
              id="hv-notif-panel"
              className="fixed right-4 top-[60px] z-[80] w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden border border-border bg-card/94 shadow-[0_28px_90px_var(--shadow-heavy),0_0_48px_var(--accent-glow)] backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between gap-2 border-b border-border bg-card px-4 py-2.5">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">
                    {isAdmin ? "互动与更新" : "通知"}
                  </h3>
                  <span className="font-mono text-xs text-muted-soft">
                    {loading ? "…" : `${notifications.length} 条`}
                  </span>
                </div>
                {notifications.length > 0 ? (
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="border border-transparent px-2 py-0.5 text-[11px] text-muted-soft transition hover:border-border hover:bg-foreground/3 hover:text-accent"
                  >
                    全部已读
                  </button>
                ) : null}
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-soft">
                    {loading ? "加载中…" : "暂无消息。"}
                  </p>
                ) : (
                  <ul>
                    {notifications.map((n) => {
                      const unread = !readIds.has(n.id);
                      const TypeIcon = ICON_BY_TYPE[n.type];
                      const card = (
                        <div
                          className={`flex items-start gap-3 border-b border-border px-4 py-3 transition hover:bg-card ${
                            unread ? "bg-accent-glow" : ""
                          }`}
                        >
                          <span
                            aria-hidden
                            className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center border border-border bg-card text-accent-soft"
                          >
                            <TypeIcon className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <p className="line-clamp-2 flex-1 text-sm font-medium leading-snug">
                                {n.title}
                              </p>
                              {n.metric ? (
                                <span className="shrink-0 font-mono text-[11px] text-accent">
                                  {n.metric}
                                </span>
                              ) : null}
                            </div>
                            {n.body ? (
                              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-soft">
                                {n.body}
                              </p>
                            ) : null}
                            <p className="mt-1 font-mono text-xs text-muted-soft">
                              {timeAgo(n.at)}
                            </p>
                          </div>
                          {unread ? (
                            <span
                              aria-hidden
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-accent"
                            />
                          ) : null}
                        </div>
                      );
                      return (
                        <li key={n.id}>
                          {n.href ? (
                            <Link
                              href={n.href}
                              onClick={() => setOpen(false)}
                              className="block"
                            >
                              {card}
                            </Link>
                          ) : (
                            card
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="border-t border-border bg-card px-4 py-2 text-[11px] text-muted-soft">
                {isAdmin ? (
                  <span>管理员视图——见点赞 / 留言 / 新订阅。</span>
                ) : (
                  <span>看新文章、站内公告与更新。</span>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
