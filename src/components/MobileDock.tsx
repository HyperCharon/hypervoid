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
  Pin,
  BookOpenText,
  Shuffle,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useLocale } from "@/components/LocaleProvider";
import { useT } from "@/components/LocaleProvider";
import { LOCALES } from "@/lib/i18n";
import { SiteSettings } from "@/components/SiteSettings";

/* ── Mobile Dock (top-right, visible <xl) ─────────────────── */
export function MobileDock() {
  const { resolvedTheme, setTheme } = useTheme();
  const { locale, setLocale } = useLocale();
  const t = useT();
  const [mounted, setMounted] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const navToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme !== "light" : true;
  const nextLocale = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length];

  // Prevent hydration mismatch — render placeholder until mounted
  if (!mounted) {
    return <div className="flex xl:hidden" style={{ height: "36px", width: "184px" }} />;
  }

  const btnClass = "flex items-center justify-center rounded-lg text-muted-soft transition-colors hover:bg-card-hover hover:text-foreground active:bg-card-hover";
  const btnStyle = { width: "36px", height: "36px" };

  return (
    <div className="flex items-center gap-0.5 xl:hidden">
      {/* Search */}
      <Link
        href="/search"
        className={btnClass}
        style={btnStyle}
        aria-label={t.common.search}
      >
        <Search className="h-[18px] w-[18px]" />
      </Link>

      {/* Locale */}
      <button
        type="button"
        onClick={() => setLocale(nextLocale)}
        className={btnClass}
        style={btnStyle}
        aria-label={t.common.toggleLocale}
      >
        <span className="text-xs font-bold uppercase">{nextLocale}</span>
      </button>

      {/* Theme */}
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={btnClass}
        style={btnStyle}
        aria-label={isDark ? "浅色" : "深色"}
      >
        {isDark ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
      </button>

      {/* Settings */}
      <SiteSettings
        triggerClassName={btnClass}
        triggerStyle={btnStyle}
        triggerChildren={<Settings2 className="h-[18px] w-[18px]" />}
      />

      {/* Nav */}
      <button
        ref={navToggleRef}
        type="button"
        onClick={() => setNavOpen((v) => !v)}
        className={btnClass}
        style={btnStyle}
        aria-label={navOpen ? "关闭导航" : "打开导航"}
        aria-expanded={navOpen}
      >
        {navOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
      </button>

      {/* Nav drawer */}
      <NavDrawer open={navOpen} onClose={() => setNavOpen(false)} toggleRef={navToggleRef} />
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
    title: "精选",
    items: [
      { href: "/pinned", icon: Pin, label: "置顶文章" },
      { href: "/series", icon: BookOpenText, label: "系列" },
      { href: "/resources", icon: Wrench, label: "资源库" },
      { href: "/posts/random", icon: Shuffle, label: "随机一篇" },
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
      { href: "/year-in-review", icon: Sparkles, label: "年度回顾" },
    ],
  },
];

function NavDrawer({ open, onClose, toggleRef }: { open: boolean; onClose: () => void; toggleRef?: React.RefObject<HTMLButtonElement | null> }) {
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
  useEffect(() => { onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click (pointerdown works on both mouse and touch).
  // Exclude the toggle button to prevent double-toggle race condition:
  // pointerdown closes the drawer, then the button's onClick reopens it.
  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      const target = e.target as Node;
      // Don't close if the click landed on the toggle button
      if (toggleRef?.current?.contains(target)) return;
      if (drawerRef.current && !drawerRef.current.contains(target)) {
        onClose();
      }
    }
    const timer = setTimeout(() => document.addEventListener("pointerdown", onPointer), 50);
    return () => { clearTimeout(timer); document.removeEventListener("pointerdown", onPointer); };
  }, [open, onClose, toggleRef]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop — sits behind header (z-40) so the toggle button remains clickable */}
      <div className="fixed inset-0 top-[48px] z-[35] bg-black/50 xl:hidden" onClick={onClose} />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed inset-x-0 top-[48px] z-[50] max-h-[calc(100dvh-48px)] overflow-y-auto border-b border-border shadow-lg overscroll-contain xl:hidden"
        style={{ background: "var(--card)", paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="px-3 py-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-3 last:mb-0">
              <p className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wider text-muted-soft/45">
                {group.title}
              </p>
              <div className="grid grid-cols-2 gap-1">
                {group.items.map(({ href, icon: Icon, label }) => {
                  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-accent/10 text-accent"
                          : "text-foreground/70 hover:bg-card-hover hover:text-foreground active:bg-card-hover"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
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
