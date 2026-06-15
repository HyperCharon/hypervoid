"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  Home, Menu, X, Moon, Sun,
  FileText, Upload, Tag, Layers, BookOpen, Image, ImageIcon,
  Megaphone, MessageSquare, Users, LinkIcon, Heart, AtSign,
  Settings, FileUser, Palette, Cat, Music, Sparkles,
  BarChart3, Search, Bot, ShieldAlert, Database,
  ArrowRightLeft, ClipboardList,
} from "lucide-react";
import { DEFAULT_ADMIN_NAV_GROUPS, type AdminNavItem } from "@/lib/admin-nav";

const ICON_MAP: Record<string, typeof FileText> = {
  "/admin/posts": FileText, "/admin/import": Upload, "/admin/tags": Tag,
  "/admin/series": Layers, "/admin/resources": BookOpen, "/admin/albums": ImageIcon,
  "/admin/media": Image, "/admin/notes": Megaphone, "/admin/guestbook": MessageSquare,
  "/admin/subscribers": Users, "/admin/friends": LinkIcon, "/admin/reactions": Heart,
  "/admin/webmentions": AtSign, "/admin/settings": Settings, "/admin/cv": FileUser,
  "/admin/themes": Palette, "/admin/mascot": Cat, "/admin/music": Music,
  "/admin/effects": Sparkles, "/admin/stats": BarChart3, "/admin/search-log": Search,
  "/admin/ai": Bot, "/admin/link-check": ShieldAlert, "/admin/backup": Database,
  "/admin/redirects": ArrowRightLeft, "/admin/audit": ClipboardList,
};

export function AdminTopNav() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const close = useCallback(() => setMenuOpen(false), []);
  useEffect(() => { close(); }, [pathname, close]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [menuOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between gap-2 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm font-semibold hover:text-accent transition-colors">
              后台
            </Link>
            <Link href="/" className="hidden sm:inline text-xs text-muted hover:text-foreground transition-colors">
              ← 回到站点
            </Link>
          </div>
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="切换主题"
              className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:text-foreground hover:bg-card-hover transition-colors"
            >
              {mounted && resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {/* Mobile menu */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
              className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:text-foreground hover:bg-card-hover transition-colors lg:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay — starts below header so toggle button stays clickable */}
      {menuOpen && (
        <div className="fixed inset-0 top-12 z-35 bg-black/50 lg:hidden" onClick={close} aria-hidden />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-72 overflow-y-auto border-l border-border bg-background transition-transform duration-200 lg:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <span className="text-sm font-semibold">导航</span>
          <button
            type="button"
            onClick={close}
            aria-label="关闭"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="overflow-y-auto p-3" style={{ height: "calc(100dvh - 3rem)", paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}>
          <Link
            href="/admin"
            onClick={close}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors mb-3 ${
              pathname === "/admin"
                ? "bg-accent/10 text-accent font-medium"
                : "text-muted hover:text-foreground hover:bg-card-hover"
            }`}
          >
            <Home className="h-4 w-4" /> 仪表盘
          </Link>
          {DEFAULT_ADMIN_NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-4">
              <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-soft">
                {group.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = ICON_MAP[item.href] || FileText;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        active
                          ? "bg-accent/10 text-accent font-medium"
                          : "text-muted hover:text-foreground hover:bg-card-hover"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
