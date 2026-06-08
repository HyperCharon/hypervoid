"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Upload,
  Tag,
  Layers,
  BookOpen,
  Image,
  ImageIcon,
  Megaphone,
  MessageSquare,
  Users,
  LinkIcon,
  Heart,
  AtSign,
  Settings,
  FileUser,
  Palette,
  Cat,
  Music,
  Sparkles,
  BarChart3,
  Search,
  Bot,
  ShieldAlert,
  Database,
  ArrowRightLeft,
  ClipboardList,
  Menu,
  X,
  Home,
} from "lucide-react";
import { DEFAULT_ADMIN_NAV_GROUPS, type AdminNavItem } from "@/lib/admin-nav";

const ICON_MAP: Record<string, typeof FileText> = {
  "/admin/posts": FileText,
  "/admin/import": Upload,
  "/admin/tags": Tag,
  "/admin/series": Layers,
  "/admin/resources": BookOpen,
  "/admin/albums": ImageIcon,
  "/admin/media": Image,
  "/admin/notes": Megaphone,
  "/admin/guestbook": MessageSquare,
  "/admin/subscribers": Users,
  "/admin/friends": LinkIcon,
  "/admin/reactions": Heart,
  "/admin/webmentions": AtSign,
  "/admin/settings": Settings,
  "/admin/cv": FileUser,
  "/admin/themes": Palette,
  "/admin/mascot": Cat,
  "/admin/music": Music,
  "/admin/effects": Sparkles,
  "/admin/stats": BarChart3,
  "/admin/search-log": Search,
  "/admin/ai": Bot,
  "/admin/link-check": ShieldAlert,
  "/admin/backup": Database,
  "/admin/redirects": ArrowRightLeft,
  "/admin/audit": ClipboardList,
};

function NavItem({ item, isActive, onClick }: { item: AdminNavItem; isActive: boolean; onClick?: () => void }) {
  const Icon = ICON_MAP[item.href] || FileText;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? "bg-zinc-800 text-zinc-50 font-medium"
          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
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

  // Close drawer on route change
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  const allItems = DEFAULT_ADMIN_NAV_GROUPS.flatMap((g) => g.items);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const nav = (
    <nav className="flex flex-col gap-4 px-3 py-4">
      {/* Dashboard link */}
      <Link
        href="/admin"
        onClick={close}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
          pathname === "/admin"
            ? "bg-zinc-800 text-zinc-50 font-medium"
            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
        }`}
      >
        <Home className="h-4 w-4 shrink-0" aria-hidden />
        <span>仪表盘</span>
      </Link>

      <div className="h-px bg-zinc-800" />

      {DEFAULT_ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800">
        <Link href="/admin" className="text-sm font-semibold text-zinc-200">
          管理后台
        </Link>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "关闭菜单" : "打开菜单"}
          className="p-2 -mr-2 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={close}
          aria-hidden
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-zinc-950 border-r border-zinc-800 transform transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <span className="text-sm font-semibold text-zinc-200">导航</span>
          <button
            type="button"
            onClick={close}
            aria-label="关闭菜单"
            className="p-1.5 -mr-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100dvh-52px)]">
          {nav}
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 bottom-0 w-56 border-r border-zinc-800 bg-zinc-950 overflow-y-auto">
        <div className="px-4 py-4 border-b border-zinc-800">
          <Link href="/admin" className="text-sm font-semibold text-zinc-200 hover:text-zinc-50 transition-colors">
            管理后台
          </Link>
        </div>
        {nav}
      </aside>

      {/* Spacer for mobile top bar */}
      <div className="lg:hidden h-12" />
    </>
  );
}
