"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SocialIcon } from "@/components/SocialIcon";
import { useT } from "@/components/LocaleProvider";
import { siteConfig } from "@/lib/site-config";
import {
  Home,
  FileText,
  Tags,
  Sparkles,
  Film,
  BookOpen,
  Gamepad2,
  Music,
  FolderOpen,
  CalendarDays,
  ImageIcon,
  NotebookPen,
  MessageSquare,
  Users,
  Info,
  Archive,
  X,
  Menu,
  Search,
  Moon,
  Sun,
  Settings2,
  Languages,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useLocale } from "@/components/LocaleProvider";
import { LOCALES } from "@/lib/i18n";
import { SiteSettings } from "@/components/SiteSettings";

/* ── Bottom Tab Bar ────────────────────────────────────────── */
const TAB_ITEMS = [
  { href: "/", icon: Home, label: "home" },
  { href: "/posts", icon: FileText, label: "posts" },
  { href: "/tags", icon: Tags, label: "tags" },
  { href: "/anime", icon: Sparkles, label: "anime" },
  { href: "/search", icon: Search, label: "搜索" },
];

function BottomTabBar({ onMenuOpen }: { onMenuOpen: () => void }) {
  const pathname = usePathname();
  const t = useT();
  const { resolvedTheme, setTheme } = useTheme();
  const { locale, setLocale } = useLocale();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme !== "light" : true;
  const nextLocale = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length];

  return (
    <nav className="hv-bottom-tab-bar fixed inset-x-0 bottom-0 z-50 lg:hidden">
      <div className="flex items-center justify-around border-t border-border/15 bg-card/80 px-1 backdrop-blur-xl">
        {/* Main tabs */}
        {TAB_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          const displayLabel = label in (t.nav as Record<string, string>) ? (t.nav as Record<string, string>)[label] : label;
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-2.5 py-1.5 transition ${
                active
                  ? "text-accent"
                  : "text-muted-soft/60 hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-mono text-[10px] uppercase tracking-wider">{displayLabel}</span>
            </Link>
          );
        })}

        {/* Theme toggle */}
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-2.5 py-1.5 text-muted-soft/60 transition hover:text-foreground"
          aria-label={isDark ? "切换到浅色" : "切换到深色"}
        >
          {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          <span className="font-mono text-[10px] uppercase tracking-wider">{isDark ? "Dark" : "Light"}</span>
        </button>

        {/* Menu button */}
        <button
          type="button"
          onClick={onMenuOpen}
          className="flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-2.5 py-1.5 text-muted-soft/60 transition hover:text-foreground"
          aria-label="打开菜单"
        >
          <Menu className="h-5 w-5" />
          <span className="font-mono text-[10px] uppercase tracking-wider">菜单</span>
        </button>
      </div>
    </nav>
  );
}

/* ── Full Menu Sheet ───────────────────────────────────────── */
function MenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const t = useT();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { locale, setLocale } = useLocale();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme !== "light" : true;
  const nextLocale = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length];

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    onClose();
  }, [pathname]);

  if (!open) return null;

  const navGroups = [
    {
      title: t.nav.groupCreate,
      items: [
        { href: "/posts", label: t.nav.posts, icon: FileText },
        { href: "/albums", label: t.nav.albums, icon: ImageIcon },
        { href: "/diary", label: t.nav.diary, icon: NotebookPen },
      ],
    },
    {
      title: t.nav.groupLife,
      items: [
        { href: "/anime", label: t.nav.anime, icon: Sparkles },
        { href: "/movies", label: t.nav.movies, icon: Film },
        { href: "/books", label: t.nav.books, icon: BookOpen },
        { href: "/games", label: t.nav.games, icon: Gamepad2 },
        { href: "/music", label: t.nav.music, icon: Music },
      ],
    },
    {
      title: t.nav.groupInteract,
      items: [
        { href: "/guestbook", label: t.nav.guestbook, icon: MessageSquare },
        { href: "/friends", label: t.nav.friends, icon: Users },
        { href: "/about", label: t.nav.about, icon: Info },
      ],
    },
    {
      title: "其他",
      items: [
        { href: "/tags", label: t.nav.tags, icon: Tags },
        { href: "/projects", label: t.nav.projects, icon: FolderOpen },
        { href: "/timeline", label: t.nav.timeline, icon: CalendarDays },
        { href: "/archive", label: "归档", icon: Archive },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] xl:hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        className="hv-menu-sheet absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border/15 bg-card/95 backdrop-blur-xl"
      >
        {/* Handle */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/10 bg-card/95 px-5 py-3 backdrop-blur-xl">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-soft/50">
            Navigation
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭菜单"
            className="grid h-8 w-8 place-items-center rounded-full border border-border/15 bg-foreground/5 text-muted-soft transition hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-4">
          {/* Quick actions */}
          <div className="mb-4 grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="flex flex-col items-center gap-1 rounded-lg border border-border/15 bg-foreground/5 px-2 py-2.5 text-muted-soft transition hover:text-foreground"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="text-[10px] font-medium">{isDark ? "浅色" : "深色"}</span>
            </button>
            <button
              type="button"
              onClick={() => setLocale(nextLocale)}
              className="flex flex-col items-center gap-1 rounded-lg border border-border/15 bg-foreground/5 px-2 py-2.5 text-muted-soft transition hover:text-foreground"
            >
              <Languages className="h-4 w-4" />
              <span className="text-[10px] font-medium">{nextLocale.toUpperCase()}</span>
            </button>
            <Link
              href="/search"
              className="flex flex-col items-center gap-1 rounded-lg border border-border/15 bg-foreground/5 px-2 py-2.5 text-muted-soft transition hover:text-foreground"
            >
              <Search className="h-4 w-4" />
              <span className="text-[10px] font-medium">搜索</span>
            </Link>
            <div className="flex flex-col items-center gap-1 rounded-lg border border-border/15 bg-foreground/5 px-2 py-2.5">
              <Settings2 className="h-4 w-4 text-muted-soft" />
              <span className="text-[10px] font-medium text-muted-soft">设置</span>
            </div>
          </div>

          {navGroups.map((group) => (
            <div key={group.title} className="mb-4 last:mb-0">
              <p className="mb-2 px-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-soft/45">
                {group.title}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${
                        active
                          ? "border border-accent/20 bg-accent/8 text-accent"
                          : "border border-transparent text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
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

          {/* Socials */}
          <div className="mt-4 border-t border-border/10 pt-4">
            <p className="mb-2 px-1 font-mono text-[9px] uppercase tracking-[0.15em] text-muted-soft/35">
              {t.nav.groupLinks}
            </p>
            <div className="flex flex-wrap gap-2">
              {siteConfig.socials.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  title={s.name}
                  aria-label={s.name}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/15 bg-foreground/5 text-muted-soft transition hover:border-accent/20 hover:text-accent"
                >
                  <SocialIcon name={s.icon} className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── MobileNav (trigger button) ────────────────────────────── */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="打开菜单"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/15 bg-foreground/5 text-muted-soft transition hover:text-foreground xl:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Bottom tab bar — always visible on mobile */}
      <BottomTabBar onMenuOpen={() => setOpen(true)} />

      {/* Full menu sheet */}
      <MenuSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
