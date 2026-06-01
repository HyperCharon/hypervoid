"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  Moon,
  Sun,
  Settings2,
  Menu,
  X,
  Home,
  FileText,
  Tags,
  Sparkles,
  Film,
  BookOpen,
  Gamepad2,
  Music,
  MessageSquare,
  Users,
  Info,
  FolderOpen,
  CalendarDays,
  Archive,
  ImageIcon,
  NotebookPen,
  Wrench,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useLocale } from "@/components/LocaleProvider";
import { useT } from "@/components/LocaleProvider";
import { LOCALES } from "@/lib/i18n";
import { SiteSettings } from "@/components/SiteSettings";

/* ── Mobile Dock (top-right, visible <lg) ─────────────────── */
export function MobileDock() {
  const { resolvedTheme, setTheme } = useTheme();
  const { locale, setLocale } = useLocale();
  const t = useT();
  const [mounted, setMounted] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme !== "light" : true;
  const nextLocale = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length];

  return (
    <div className="flex items-center gap-0.5 lg:hidden">
      {/* Search */}
      <Link
        href="/search"
        className="grid h-8 w-8 place-items-center rounded-lg text-muted-soft transition hover:bg-card-hover hover:text-foreground"
        aria-label={t.common.search}
      >
        <Search className="h-4 w-4" />
      </Link>

      {/* Locale */}
      <button
        type="button"
        onClick={() => setLocale(nextLocale)}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted-soft transition hover:bg-card-hover hover:text-foreground"
        aria-label={t.common.toggleLocale}
      >
        <span className="text-[11px] font-bold uppercase">{nextLocale}</span>
      </button>

      {/* Theme */}
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted-soft transition hover:bg-card-hover hover:text-foreground"
        aria-label={isDark ? "浅色" : "深色"}
      >
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>

      {/* Settings */}
      <SiteSettings
        triggerClassName="grid h-8 w-8 place-items-center rounded-lg text-muted-soft transition hover:bg-card-hover hover:text-foreground"
        triggerChildren={<Settings2 className="h-4 w-4" />}
      />

      {/* Nav */}
      <button
        type="button"
        onClick={() => setNavOpen((v) => !v)}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted-soft transition hover:bg-card-hover hover:text-foreground"
        aria-label={navOpen ? "关闭导航" : "打开导航"}
        aria-expanded={navOpen}
      >
        {navOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Nav drawer */}
      <NavDrawer open={navOpen} onClose={() => setNavOpen(false)} />
    </div>
  );
}

/* ── Nav Drawer (slides down from header) ──────────────────── */
const NAV_GROUPS = [
  {
    title: "创作",
    items: [
      { href: "/", icon: Home, label: "首页" },
      { href: "/posts", icon: FileText, label: "文章" },
      { href: "/albums", icon: ImageIcon, label: "相册" },
      { href: "/diary", icon: NotebookPen, label: "日记" },
    ],
  },
  {
    title: "生活",
    items: [
      { href: "/anime", icon: Sparkles, label: "番剧" },
      { href: "/movies", icon: Film, label: "影视" },
      { href: "/books", icon: BookOpen, label: "阅读" },
      { href: "/games", icon: Gamepad2, label: "游戏" },
      { href: "/music", icon: Music, label: "音乐" },
    ],
  },
  {
    title: "互动",
    items: [
      { href: "/guestbook", icon: MessageSquare, label: "留言" },
      { href: "/friends", icon: Users, label: "友链" },
      { href: "/about", icon: Info, label: "关于" },
    ],
  },
  {
    title: "其他",
    items: [
      { href: "/tags", icon: Tags, label: "标签" },
      { href: "/skills", icon: Wrench, label: "技能" },
      { href: "/projects", icon: FolderOpen, label: "项目" },
      { href: "/timeline", icon: CalendarDays, label: "时间线" },
      { href: "/archive", icon: Archive, label: "归档" },
    ],
  },
];

function NavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on route change
  useEffect(() => { onClose(); }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    const timer = setTimeout(() => document.addEventListener("mousedown", onClick), 50);
    return () => { clearTimeout(timer); document.removeEventListener("mousedown", onClick); };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[45] bg-black/50 backdrop-blur-sm lg:hidden" onClick={onClose} />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed inset-x-0 top-12 z-[50] max-h-[calc(100dvh-3rem)] overflow-y-auto border-b border-border bg-card shadow-lg lg:hidden"
      >
        <div className="px-3 py-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-3 last:mb-0">
              <p className="mb-1.5 px-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-soft/45">
                {group.title}
              </p>
              <div className="grid grid-cols-2 gap-1">
                {group.items.map(({ href, icon: Icon, label }) => {
                  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${
                        active
                          ? "bg-accent/10 text-accent"
                          : "text-foreground/70 hover:bg-card-hover hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
