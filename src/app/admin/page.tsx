import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, LockKeyhole, LogOut, PenLine, ShieldAlert, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { auth, signOut } from "@/auth";
import { listAllPosts } from "@/db/admin-posts";
import { countActiveSubscribers } from "@/lib/newsletter";
import { getSiteStats } from "@/lib/stats";
import { formatDateCN } from "@/lib/datetime";

export const metadata: Metadata = {
  title: "管理后台",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type AdminNavItem = {
  href: string;
  title: string;
  desc: string;
  countKey?: "posts";
};

type AdminNavGroup = {
  title: string;
  desc: string;
  items: AdminNavItem[];
};

const DEFAULT_ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    title: "内容生产",
    desc: "文章、标签、资源、相册和媒体资产。",
    items: [
      {
        href: "/admin/posts",
        title: "文章管理",
        desc: "创建、编辑、删除文章，草稿、定时发布",
        countKey: "posts",
      },
      {
        href: "/admin/import",
        title: "导入文章",
        desc: "批量导入 Markdown 文件，自动解析 frontmatter",
      },
      {
        href: "/admin/tags",
        title: "标签管理",
        desc: "跨文章重命名、合并、删除标签",
      },
      {
        href: "/admin/resources",
        title: "资源库",
        desc: "收藏链接、软件、工具，展示在 /resources",
      },
      {
        href: "/admin/albums",
        title: "相册管理",
        desc: "创建相册、上传照片、添加说明",
      },
      {
        href: "/admin/media",
        title: "图库管理",
        desc: "查看 Blob 图片、复制 URL、清理孤儿图",
      },
    ],
  },
  {
    title: "互动运营",
    desc: "访客留言、订阅、友链、公告和数据反馈。",
    items: [
      {
        href: "/admin/notes",
        title: "公告管理",
        desc: "顶部条、侧边栏、文章顶部公告，支持时间窗",
      },
      {
        href: "/admin/guestbook",
        title: "留言板管理",
        desc: "审核访客留言：隐藏、恢复、删除",
      },
      {
        href: "/admin/subscribers",
        title: "订阅者管理",
        desc: "查看邮箱订阅列表，手动退订或删除",
      },
      {
        href: "/admin/friends",
        title: "友链管理",
        desc: "维护朋友的博客与个人站点链接",
      },
      {
        href: "/admin/reactions",
        title: "反应数据",
        desc: "每篇文章 emoji 反应数，识别受欢迎内容",
      },
      {
        href: "/admin/webmentions",
        title: "Webmention 审核",
        desc: "外站引用留痕，隐藏或删除可疑来源",
      },
    ],
  },
  {
    title: "站点外观",
    desc: "主题、看板娘、音乐播放器和全站展示偏好。",
    items: [
      {
        href: "/admin/settings",
        title: "站点设置",
        desc: "作者名、头像、简介、首页名句、公告文本",
      },
      {
        href: "/admin/themes",
        title: "主题定制",
        desc: "调色板、实时预览、JSON 主题包导入导出",
      },
      {
        href: "/admin/mascot",
        title: "看板娘设置",
        desc: "默认角色、访客切换权限、切换按钮显示",
      },
      {
        href: "/admin/music",
        title: "音乐设置",
        desc: "管理音源、歌单、播放器和 Cookie 状态",
      },
      {
        href: "/admin/effects",
        title: "视觉特效",
        desc: "开关粒子、光晕、播放器小组件等增强效果",
      },
    ],
  },
  {
    title: "工具系统",
    desc: "统计分析、AI、链接巡检和备份维护。",
    items: [
      {
        href: "/admin/stats",
        title: "数据看板",
        desc: "月度发文趋势、热门文章排行、累计指标",
      },
      {
        href: "/admin/search-log",
        title: "搜索分析",
        desc: "站内搜索查询、命中数和零结果分析",
      },
      {
        href: "/admin/ai",
        title: "AI 配置",
        desc: "切换模型、API Key 状态、摘要/标签/Q&A 设置",
      },
      {
        href: "/admin/link-check",
        title: "失效链接巡检",
        desc: "扫描已发布文章外链，标记 404、超时、SSL 错误",
      },
      {
        href: "/admin/backup",
        title: "数据备份",
        desc: "导出整库 JSON 到 Blob，下载或删除历史快照",
      },
    ],
  },
  {
    title: "其他",
    desc: "低频但仍需要保留入口的后台功能。",
    items: [
      {
        href: "/admin/redirects",
        title: "短链管理",
        desc: "/r/<码> 跳转和命中计数",
      },
      {
        href: "/admin/audit",
        title: "操作审计",
        desc: "所有后台动作的只读时间线",
      },
    ],
  },
];

// Add project-specific admin groups here. A custom group with the same title as
// a default group appends items to that group; a new title creates a new group.
const CUSTOM_ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    title: "内容生产",
    desc: "",
    items: [
      {
        href: "/admin/series",
        title: "专题合集",
        desc: "管理文章系列：重命名、删除、查看系列内文章",
      },
    ],
  },
];

function mergeAdminNavGroups(
  defaults: AdminNavGroup[],
  custom: AdminNavGroup[],
): AdminNavGroup[] {
  const groups = new Map<string, AdminNavGroup>();
  for (const group of [...defaults, ...custom]) {
    const existing = groups.get(group.title);
    if (existing) {
      existing.items.push(...group.items);
    } else {
      groups.set(group.title, { ...group, items: [...group.items] });
    }
  }
  return [...groups.values()].filter((group) => group.items.length > 0);
}

const ADMIN_NAV_GROUPS = mergeAdminNavGroups(
  DEFAULT_ADMIN_NAV_GROUPS,
  CUSTOM_ADMIN_NAV_GROUPS,
);

export default async function AdminHome() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const login =
    (session.user as { login?: string }).login ?? session.user.name ?? "?";

  const [allPosts, subscriberCount, stats] = await Promise.all([
    listAllPosts(),
    countActiveSubscribers(),
    getSiteStats({ isAdmin: true }),
  ]);

  const drafts = allPosts.filter((p) => p.status === "draft");
  const scheduled = allPosts.filter(
    (p) => p.status === "scheduled" && p.publishAt && p.publishAt > new Date(),
  );
  const privateOnes = allPosts.filter((p) => p.visibility === "private");
  const missingSummary = allPosts.filter(
    (p) => p.status === "published" && !p.summary && p.content.length >= 200,
  );
  const recentPublished = allPosts
    .filter((p) => p.status === "published")
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <header className="hv-panel-sci relative overflow-hidden p-4 sm:p-7 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {/* Corner accent lines */}
        <div className="absolute left-0 top-0 h-12 w-12 border-l-2 border-t-2 border-accent/60 pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-12 w-12 border-r-2 border-b-2 border-accent/60 pointer-events-none" />

        {/* Pulse beacon */}
        <div className="absolute right-5 top-5 h-2 w-2 rounded-full bg-accent animate-pulse" />

        <div className="min-w-0">
          <p className="hv-kicker">ADMIN_CONSOLE / CONTROL_DECK</p>
          <h1 className="hv-title mt-2 text-2xl font-black tracking-tight sm:text-4xl uppercase">管理后台</h1>
          <p className="mt-2 font-mono text-sm text-muted uppercase">
            OPERATOR：<span className="font-medium text-foreground">@{login}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/admin/posts/new"
            className="hv-action whitespace-nowrap px-2.5 py-1.5 text-xs font-medium sm:px-4 sm:text-sm"
          >
            <PenLine className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
            <span className="hidden sm:inline">新文章</span>
            <span className="sm:hidden">写</span>
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="hv-action whitespace-nowrap px-2.5 py-1.5 text-xs sm:px-4 sm:text-sm"
            >
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
              退出
            </button>
          </form>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="PUBLISHED" value={stats.posts} hint="visible 文章" />
        <StatCard label="TOTAL_VIEWS" value={stats.views} hint="累计 PV" />
        <StatCard label="TOTAL_LIKES" value={stats.likes} hint="累计 reactions" />
        <StatCard
          label="SUBSCRIBERS"
          value={subscriberCount}
          hint="已确认邮箱"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="hv-panel-sci p-5">
          <h2 className="hv-title font-mono text-sm font-semibold tracking-wider uppercase">
            RECENT_PUBLISHED
          </h2>
          {recentPublished.length === 0 ? (
            <p className="mt-3 text-sm text-muted">还没有已发布文章。</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-1.5">
              {recentPublished.map((p) => (
                <li
                  key={p.slug}
                  className="flex items-baseline justify-between gap-3 border border-transparent px-2 py-1.5 transition hover:border-accent/30 hover:bg-accent/5 clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)]"
                >
                  <Link
                    href={`/admin/posts/${p.slug}/edit`}
                    className="min-w-0 flex-1 truncate text-sm text-foreground hover:text-foreground"
                  >
                    {p.visibility === "private" ? (
                      <LockKeyhole className="mr-1 inline h-3.5 w-3.5 text-muted" aria-label="私密" />
                    ) : null}
                    {p.title}
                  </Link>
                  <time className="shrink-0 font-mono text-[11px] text-muted uppercase">
                    {p.publishAt ? formatDateCN(p.publishAt) : "—"}
                  </time>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/admin/posts"
            className="hv-action mt-3 min-h-8 px-3 text-xs font-mono uppercase clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)] hover:shadow-[0_0_16px_var(--accent-glow)]"
          >
            VIEW_ALL <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <PendingCard
            label="草稿"
            count={drafts.length}
            href="/admin/posts"
            description="未发布的草稿"
          />
          <PendingCard
            label="定时待发"
            count={scheduled.length}
            href="/admin/posts"
            description="未到点的定时"
          />
          <PendingCard
            label="私密"
            count={privateOnes.length}
            href="/admin/posts"
            description="仅管理员可见"
          />
          {missingSummary.length > 0 ? (
            <div className="border border-amber-300/30 bg-amber-300/10 p-3 text-xs">
              <p className="flex items-center gap-1.5 font-medium text-amber-200">
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden /> {missingSummary.length} 篇已发布文章还没 AI 摘要
              </p>
              <p className="mt-1 text-muted">
                保存后会自动生成；老文章可去编辑页手动点「生成 AI 摘要」
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="hv-kicker uppercase">
            ADMIN_FUNCTIONS
          </h2>
          <p className="mt-1 text-xs text-muted">
            按使用场景分组，常用入口不用在一整屏卡片里找。
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {ADMIN_NAV_GROUPS.map((group) => (
            <div
              key={group.title}
              className="hv-panel-sci p-4"
            >
              <div className="mb-3 border-b border-accent/20 pb-3">
                <h3 className="hv-title font-mono text-base font-semibold tracking-wider uppercase">
                  {group.title}
                </h3>
                <p className="mt-1 text-xs text-muted">{group.desc}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.items.map((item) => (
                  <NavTile
                    key={item.href}
                    href={item.href}
                    title={item.title}
                    desc={item.desc}
                    count={item.countKey === "posts" ? allPosts.length : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted">
        <Sparkles className="inline h-3.5 w-3.5 text-muted" aria-hidden /> 站点已运行 <span className="font-mono">{stats.daysOnline}</span> 天
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="hv-panel-sci p-4 relative overflow-hidden">
      {/* Corner accent */}
      <div className="absolute right-0 top-0 h-8 w-8 border-r border-t border-accent/40 pointer-events-none" />

      <p className="hv-kicker uppercase">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-bold leading-tight text-foreground sm:text-3xl">
        {value.toLocaleString("en-US")}
      </p>
      {hint ? (
        <p className="mt-0.5 text-[11px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function PendingCard({
  label,
  count,
  href,
  description,
}: {
  label: string;
  count: number;
  href: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="hv-panel-sci group flex items-center justify-between gap-3 p-3 transition hover:border-accent/40 hover:shadow-[0_0_20px_var(--accent-glow)]"
    >
      <div>
        <p className="font-mono text-xs text-muted uppercase">{label}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
      <span className="font-mono text-2xl font-bold text-foreground group-hover:text-foreground">
        {count}
      </span>
    </Link>
  );
}

function NavTile({
  href,
  title,
  desc,
  count,
}: {
  href: string;
  title: string;
  desc: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className="group relative border border-accent/16 bg-card p-3 transition hover:border-accent/40 hover:bg-accent/8 clip-path-[polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,0_100%)] hover:shadow-[0_0_16px_var(--accent-glow)]"
    >
      {/* Corner accent */}
      <div className="absolute right-0 top-0 h-6 w-6 border-r border-t border-accent/30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground group-hover:text-foreground">
          {title} <ArrowRight className="inline h-3.5 w-3.5" aria-hidden />
        </h3>
        {count !== undefined ? (
          <span className="font-mono text-xs text-muted">{count}</span>
        ) : null}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-muted">{desc}</p>
    </Link>
  );
}
