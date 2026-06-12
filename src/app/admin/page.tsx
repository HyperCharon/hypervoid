import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, FileUser, LockKeyhole, LogOut, PenLine, ShieldAlert,
  FileText, Bot, BarChart3, Palette, Eye, Heart, Users, Clock,
  FileEdit, Globe, Lock,
} from "lucide-react";
import type { Metadata } from "next";
import { auth, signOut } from "@/auth";
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

const QUICK_LINKS = [
  { href: "/admin/posts/new", icon: PenLine, label: "写文章", accent: true },
  { href: "/admin/posts", icon: FileText, label: "文章" },
  { href: "/admin/ai", icon: Bot, label: "AI" },
  { href: "/admin/stats", icon: BarChart3, label: "统计" },
  { href: "/admin/themes", icon: Palette, label: "主题" },
  { href: "/admin/cv", icon: FileUser, label: "简历" },
];

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
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <PenLine className="h-4 w-4" /> 写文章
          </Link>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button type="submit" className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-card-hover transition-colors">
              <LogOut className="h-4 w-4" /> 退出
            </button>
          </form>
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
          <div key={label} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-border/60">
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
        {QUICK_LINKS.map(({ href, icon: Icon, label, accent }) => (
          <Link
            key={href}
            href={href}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              accent
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "border border-border bg-card hover:bg-card-hover"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
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
            { icon: FileEdit, label: "草稿", count: drafts.length, href: "/admin/posts", color: "text-amber-500" },
            { icon: Clock, label: "定时待发", count: scheduled.length, href: "/admin/posts", color: "text-blue-500" },
            { icon: Lock, label: "私密文章", count: privateOnes.length, href: "/admin/posts", color: "text-zinc-400" },
          ].map(({ icon: Icon, label, count, href, color }) => (
            <Link key={label} href={href} className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-card-hover transition-colors">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="flex-1 text-sm">{label}</span>
              <span className="text-lg font-bold tabular-nums">{count}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
          {missingSummary.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
              <p className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-300">
                <ShieldAlert className="h-3.5 w-3.5" /> {missingSummary.length} 篇缺少 AI 摘要
              </p>
              <p className="mt-1 text-muted">编辑页可手动生成</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation groups */}
      <div className="grid gap-4 sm:grid-cols-2">
        {DEFAULT_ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.title} className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">{group.title}</h3>
              <p className="mt-0.5 text-xs text-muted">{group.desc}</p>
            </div>
            <div className="grid grid-cols-2 gap-0.5 p-2">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-card-hover hover:text-foreground transition-colors"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted">站点已运行 {stats.daysOnline} 天</p>
    </div>
  );
}
