/**
 * Shared admin navigation structure.
 * Used by the dashboard page AND the admin layout sidebar/drawer.
 */

export type AdminNavItem = {
  href: string;
  title: string;
  desc: string;
  icon?: string;
  countKey?: "posts";
};

export type AdminNavGroup = {
  title: string;
  desc: string;
  items: AdminNavItem[];
};

export const DEFAULT_ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    title: "内容",
    desc: "文章、标签、系列、媒体",
    items: [
      { href: "/admin/posts", title: "文章管理", desc: "创建、编辑、删除", countKey: "posts" },
      { href: "/admin/import", title: "导入", desc: "批量导入 Markdown" },
      { href: "/admin/tags", title: "标签", desc: "重命名、合并、删除" },
      { href: "/admin/series", title: "系列", desc: "文章系列管理" },
      { href: "/admin/resources", title: "资源库", desc: "收藏链接和工具" },
      { href: "/admin/albums", title: "相册", desc: "相册和照片管理" },
      { href: "/admin/media", title: "图库", desc: "Blob 图片管理" },
    ],
  },
  {
    title: "互动",
    desc: "留言、订阅、友链、反馈",
    items: [
      { href: "/admin/notes", title: "公告", desc: "顶部条、侧边栏公告" },
      { href: "/admin/guestbook", title: "留言板", desc: "审核访客留言" },
      { href: "/admin/subscribers", title: "订阅者", desc: "邮箱订阅管理" },
      { href: "/admin/friends", title: "友链", desc: "博客链接管理" },
      { href: "/admin/reactions", title: "反应", desc: "文章 emoji 数据" },
      { href: "/admin/webmentions", title: "Webmention", desc: "外站引用审核" },
    ],
  },
  {
    title: "外观",
    desc: "主题、播放器、特效",
    items: [
      { href: "/admin/settings", title: "站点设置", desc: "作者、头像、简介" },
      { href: "/admin/cv", title: "简历", desc: "编辑网页简历" },
      { href: "/admin/themes", title: "主题", desc: "调色板、实时预览" },
      { href: "/admin/mascot", title: "看板娘", desc: "角色、切换权限" },
      { href: "/admin/music", title: "音乐", desc: "音源、歌单设置" },
      { href: "/admin/effects", title: "特效", desc: "粒子、光晕开关" },
    ],
  },
  {
    title: "系统",
    desc: "统计、AI、备份、维护",
    items: [
      { href: "/admin/stats", title: "统计", desc: "趋势、排行榜" },
      { href: "/admin/search-log", title: "搜索分析", desc: "查询分析" },
      { href: "/admin/ai", title: "AI 配置", desc: "模型、Key、配额" },
      { href: "/admin/link-check", title: "链接巡检", desc: "外链失效扫描" },
      { href: "/admin/backup", title: "备份", desc: "导出、下载、删除" },
    ],
  },
  {
    title: "其他",
    desc: "低频功能",
    items: [
      { href: "/admin/redirects", title: "短链", desc: "/r/ 跳转管理" },
      { href: "/admin/audit", title: "审计", desc: "操作时间线" },
    ],
  },
];

/** Flatten all nav items into a single list (for sidebar rendering). */
export function flatNavItems(): (AdminNavItem & { group: string })[] {
  return DEFAULT_ADMIN_NAV_GROUPS.flatMap((g) =>
    g.items.map((item) => ({ ...item, group: g.title })),
  );
}
