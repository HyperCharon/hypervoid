"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  FileText, Upload, Tag, Layers, BookOpen, Image, ImageIcon,
  Megaphone, MessageSquare, Users, LinkIcon, Heart, AtSign,
  Settings, FileUser, Palette, Cat, Music, Sparkles,
  BarChart3, Search, Bot, ShieldAlert, Database,
  ArrowRightLeft, ClipboardList, Menu, X, Home, LogOut,
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

function NavItem({ item, isActive, onClick }: { item: AdminNavItem; isActive: boolean; onClick?: () => void }) {
  const Icon = ICON_MAP[item.href] || FileText;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        isActive
          ? "bg-accent/10 text-accent font-medium"
          : "text-muted hover:text-foreground hover:bg-card-hover"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="truncate">{item.title}</span>
    </Link>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => { close(); }, [pathname, close]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const nav = (
    <nav className="flex flex-col gap-5 px-3 py-4">
      <Link
        href="/admin"
        onClick={close}
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
          pathname === "/admin"
            ? "bg-accent/10 text-accent font-medium"
            : "text-muted hover:text-foreground hover:bg-card-hover"
        }`}
      >
        <Home className="h-4 w-4 shrink-0" aria-hidden />
        <span>仪表盘</span>
      </Link>

      <div className="h-px bg-border" />

      {DEFAULT_ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-soft">
            {group.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <NavItem key={item.href} item={item} isActive={isActive(item.href)} onClick={close} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-12 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
        <Link href="/admin" className="text-sm font-semibold">管理后台</Link>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "关闭菜单" : "打开菜单"}
          className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:text-foreground transition-colors"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={close} aria-hidden />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-background transition-transform duration-200 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
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
        <div className="overflow-y-auto" style={{ height: "calc(100dvh - 3rem)" }}>
          {nav}
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border bg-background overflow-y-auto lg:block">
        <div className="flex h-14 items-center border-b border-border px-5">
          <Link href="/admin" className="text-sm font-semibold hover:text-accent transition-colors">
            管理后台
          </Link>
        </div>
        {nav}
      </aside>

      {/* Mobile top bar spacer */}
      <div className="h-12 lg:hidden" />
    </>
  );
}
