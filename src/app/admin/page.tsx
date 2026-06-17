import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import {
  ArrowRight, FileUser, LockKeyhole, LogOut, PenLine, ShieldAlert,
  FileText, Bot, BarChart3, Palette, Eye, Heart, Users, Clock,
  FileEdit, Lock, Sparkles, Upload, Tag, Layers, BookOpen, Image,
  ImageIcon, Megaphone, MessageSquare, LinkIcon, AtSign, Settings,
  Cat, Music, Search, Database, ArrowRightLeft, ClipboardList,
} from "lucide-react";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { listAllPosts } from "@/db/admin-posts";
import { countActiveSubscribers } from "@/lib/newsletter";
import { getSiteStats } from "@/lib/stats";
import { formatDateCN } from "@/lib/datetime";
import { DEFAULT_ADMIN_NAV_GROUPS } from "@/lib/admin-nav";

export const metadata: Metadata = {
  title: "管理后台",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const GROUP_ICONS: Record<string, typeof FileText> = {
  "内容": FileText,
  "互动": MessageSquare,
  "外观": Palette,
  "系统": BarChart3,
  "其他": ArrowRightLeft,
};

const ITEM_ICONS: Record<string, typeof FileText> = {
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

export default async function AdminHome() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const login = (session.user as { login?: string }).login ?? session.user.name ?? "?";

  const [allPosts, subscriberCount, stats] = await Promise.all([
    listAllPosts(),
    countActiveSubscribers(),
    getSiteStats({ isAdmin: true }),
  ]);

  const drafts = allPosts.filter((p) => p.status === "draft");
  const scheduled = allPosts.filter((p) => p.status === "scheduled" && p.publishAt && p.publishAt > new Date());
  const privateOnes = allPosts.filter((p) => p.visibility === "private");
  const missingSummary = allPosts.filter((p) => p.status === "published" && !p.summary && p.content.length >= 200);
  const recentPublished = allPosts.filter((p) => p.status === "published").slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">管理后台</h1>
          <p className="mt-0.5 text-sm text-muted">@{login}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/posts/new"
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <PenLine className="h-4 w-4" /> 写文章
          </Link>
          <SignOutButton className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-card-hover transition-colors">
            <LogOut className="h-4 w-4" /> 退出
          </SignOutButton>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Eye, label: "已发布", value: stats.posts, color: "text-blue-500", bg: "bg-blue-500/10" },
          { icon: BarChart3, label: "总浏览", value: stats.views, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { icon: Heart, label: "总反应", value: stats.likes, color: "text-rose-500", bg: "bg-rose-500/10" },
          { icon: Users, label: "订阅者", value: subscriberCount, color: "text-violet-500", bg: "bg-violet-500/10" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold tabular-nums">{value.toLocaleString("zh-CN")}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { href: "/admin/posts/new", icon: PenLine, label: "写文章" },
          { href: "/admin/posts", icon: FileText, label: "文章" },
          { href: "/admin/ai", icon: Bot, label: "AI" },
          { href: "/admin/stats", icon: BarChart3, label: "统计" },
          { href: "/admin/themes", icon: Palette, label: "主题" },
          { href: "/admin/cv", icon: FileUser, label: "简历" },
        ].map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-card-hover transition-colors"
          >
            <Icon className="h-4 w-4 text-accent" /> {label}
          </Link>
        ))}
      </div>

      {/* Recent + Pending */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Recent published */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium">最近发布</h2>
            <Link href="/admin/posts" className="flex items-center gap-1 text-xs text-accent hover:underline">
              全部 <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentPublished.length === 0 ? (
            <p className="p-4 text-sm text-muted">还没有已发布文章。</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentPublished.map((p) => (
                <li key={p.slug}>
                  <Link href={`/admin/posts/${p.slug}/edit`} className="flex items-baseline justify-between gap-3 px-4 py-2.5 hover:bg-card-hover transition-colors">
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {p.visibility === "private" && <LockKeyhole className="mr-1 inline h-3 w-3 text-muted" />}
                      {p.title}
                    </span>
                    <time className="shrink-0 text-xs text-muted">{p.publishAt ? formatDateCN(p.publishAt) : "—"}</time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pending items */}
        <div className="flex flex-col gap-3">
          {[
            { icon: FileEdit, label: "草稿", count: drafts.length, href: "/admin/posts", color: "text-amber-500", bg: "bg-amber-500/10" },
            { icon: Clock, label: "定时待发", count: scheduled.length, href: "/admin/posts", color: "text-blue-500", bg: "bg-blue-500/10" },
            { icon: Lock, label: "私密文章", count: privateOnes.length, href: "/admin/posts", color: "text-zinc-400", bg: "bg-zinc-400/10" },
          ].map(({ icon: Icon, label, count, href, color, bg }) => (
            <Link key={label} href={href} className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-card-hover transition-colors">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <span className="flex-1 text-sm">{label}</span>
              <span className="text-lg font-bold tabular-nums">{count}</span>
              <ArrowRight className="h-4 w-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
          {missingSummary.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
              <p className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300">
                <ShieldAlert className="h-3.5 w-3.5" /> {missingSummary.length} 篇缺少 AI 摘要
              </p>
              <p className="mt-1 text-muted">编辑页可手动生成</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation groups */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">管理功能</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {DEFAULT_ADMIN_NAV_GROUPS.map((group) => {
            const GroupIcon = GROUP_ICONS[group.title] || FileText;
            return (
              <div key={group.title} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                    <GroupIcon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{group.title}</h3>
                    <p className="text-xs text-muted">{group.desc}</p>
                  </div>
                </div>
                <div className="p-2">
                  {group.items.map((item) => {
                    const ItemIcon = ITEM_ICONS[item.href] || FileText;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-card-hover hover:text-foreground transition-colors"
                      >
                        <ItemIcon className="h-3.5 w-3.5 shrink-0 text-muted-soft" />
                        <span className="flex-1 truncate">{item.title}</span>
                        <span className="hidden sm:inline ml-auto text-xs text-muted-soft truncate">{item.desc}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted">
        <Sparkles className="inline h-3 w-3 mr-0.5" />
        站点已运行 {stats.daysOnline} 天
      </p>
    </div>
  );
}
