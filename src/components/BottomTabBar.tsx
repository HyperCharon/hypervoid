"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
  icon: React.ReactNode;
};

const Icon = {
  Home: () => (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H10v7H4a1 1 0 0 1-1-1z" />
    </svg>
  ),
  Posts: () => (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4h11a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2-3-2V6a2 2 0 0 1 2-2z" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="9" y1="12" x2="15" y2="12" />
    </svg>
  ),
  Search: () => (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  Tags: () => (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.59 13.41L13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1" fill="currentColor" />
    </svg>
  ),
};

const TABS: Tab[] = [
  { href: "/", label: "首页", match: (p) => p === "/", icon: <Icon.Home /> },
  {
    href: "/posts",
    label: "文章",
    match: (p) => p === "/posts" || p.startsWith("/posts/"),
    icon: <Icon.Posts />,
  },
  {
    href: "/search",
    label: "搜索",
    match: (p) => p.startsWith("/search"),
    icon: <Icon.Search />,
  },
  {
    href: "/tags",
    label: "标签",
    match: (p) => p.startsWith("/tags"),
    icon: <Icon.Tags />,
  },
];

export function BottomTabBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      aria-label="底部导航"
      className="hv-grad-tabbar fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Top accent line */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[2px]" style={{ background: "var(--rainbow)", opacity: 0.4 }} />

      {TABS.map((t) => {
        const active = t.match(pathname);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-2.5 font-mono text-xs uppercase tracking-wider transition ${
              active
                ? "text-accent"
                : "text-muted-soft hover:text-accent active:text-accent"
            }`}
          >
            {/* Active indicator */}
            {active && (
              <div aria-hidden className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent" />
            )}
            <span aria-hidden className={`transition ${active ? "scale-110" : ""}`}>{t.icon}</span>
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
