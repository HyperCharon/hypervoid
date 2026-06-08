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
    title: "内容生产",
    desc: "文章、标签、资源、相册和媒体资产。",
    items: [
      { href: "/admin/posts", title: "文章管理", desc: "创建、编辑、删除文章，草稿、定时发布", countKey: "posts" },
      { href: "/admin/import", title: "导入文章", desc: "批量导入 Markdown 文件" },
      { href: "/admin/tags", title: "标签管理", desc: "重命名、合并、删除标签" },
      { href: "/admin/series", title: "专题合集", desc: "管理文章系列" },
      { href: "/admin/resources", title: "资源库", desc: "收藏链接、软件、工具" },
      { href: "/admin/albums", title: "相册管理", desc: "创建相册、上传照片" },
      { href: "/admin/media", title: "图库管理", desc: "Blob 图片、清理孤儿图" },
    ],
  },
  {
    title: "互动运营",
    desc: "访客留言、订阅、友链、公告和数据反馈。",
    items: [
      { href: "/admin/notes", title: "公告管理", desc: "顶部条、侧边栏公告" },
      { href: "/admin/guestbook", title: "留言板", desc: "审核访客留言" },
      { href: "/admin/subscribers", title: "订阅者", desc: "邮箱订阅列表管理" },
      { href: "/admin/friends", title: "友链管理", desc: "维护朋友博客链接" },
      { href: "/admin/reactions", title: "反应数据", desc: "每篇文章 emoji 反应" },
      { href: "/admin/webmentions", title: "Webmention", desc: "外站引用留痕审核" },
    ],
  },
  {
    title: "站点外观",
    desc: "主题、看板娘、音乐播放器和全站展示偏好。",
    items: [
      { href: "/admin/settings", title: "站点设置", desc: "作者名、头像、简介" },
      { href: "/admin/cv", title: "简历管理", desc: "编辑网页简历内容" },
      { href: "/admin/themes", title: "主题定制", desc: "调色板、实时预览" },
      { href: "/admin/mascot", title: "看板娘", desc: "默认角色、切换权限" },
      { href: "/admin/music", title: "音乐设置", desc: "音源、歌单、播放器" },
      { href: "/admin/effects", title: "视觉特效", desc: "粒子、光晕、播放器" },
    ],
  },
  {
    title: "工具系统",
    desc: "统计分析、AI、链接巡检和备份维护。",
    items: [
      { href: "/admin/stats", title: "数据看板", desc: "月度趋势、热门排行" },
      { href: "/admin/search-log", title: "搜索分析", desc: "站内搜索查询分析" },
      { href: "/admin/ai", title: "AI 配置", desc: "模型、API Key、摘要设置" },
      { href: "/admin/link-check", title: "链接巡检", desc: "扫描外链失效" },
      { href: "/admin/backup", title: "数据备份", desc: "导出/下载/删除快照" },
    ],
  },
  {
    title: "其他",
    desc: "低频功能。",
    items: [
      { href: "/admin/redirects", title: "短链管理", desc: "/r/ 跳转和命中计数" },
      { href: "/admin/audit", title: "操作审计", desc: "所有后台动作时间线" },
    ],
  },
];

/** Flatten all nav items into a single list (for sidebar rendering). */
export function flatNavItems(): (AdminNavItem & { group: string })[] {
  return DEFAULT_ADMIN_NAV_GROUPS.flatMap((g) =>
    g.items.map((item) => ({ ...item, group: g.title })),
  );
}
