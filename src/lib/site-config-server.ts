import "server-only";

import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { siteConfig } from "@/lib/site-config";

export type OverridableFields =
  | "name"
  | "title"
  | "description"
  | "author.name"
  | "author.handle"
  | "author.bio"
  | "author.avatar"
  | "author.githubUsername"
  | "author.githubUrl"
  | "bangumiUserId"
  | "rss.title"
  | "rss.description"
  | "socials.github"
  | "socials.bilibili"
  | "socials.gitee"
  | "socials.codeberg"
  | "socials.steam"
  | "announcementMessage"
  | "announcementLink"
  | "announcementLinkText"
  | "home.quote"
  | "home.quoteAuthor"
  | "mascot.allowUserSwitch"
  | "mascot.showSwitchButton"
  | "mascot.defaultCharacter"
  | "music.sourceMode"
  | "music.playlistId"
  | "music.savedPlaylists"
  | "music.lxApiUrl"
  | "music.localTracks"
  | "effects.playerWidget"
  | "effects.clickParticles"
  | "effects.textSparkle"
  | "effects.particles"
  | "effects.glow";

const DEFAULT_MAP: Record<OverridableFields, string> = {
  name: siteConfig.name,
  title: siteConfig.title,
  description: siteConfig.description,
  "author.name": siteConfig.author.name,
  "author.handle": siteConfig.author.handle,
  "author.bio": siteConfig.author.bio,
  "author.avatar": siteConfig.author.avatar,
  "author.githubUsername": siteConfig.author.githubUsername,
  "author.githubUrl": siteConfig.author.githubUrl,
  bangumiUserId: siteConfig.bangumiUserId,
  "rss.title": siteConfig.rss.title,
  "rss.description": siteConfig.rss.description,
  "socials.github": siteConfig.socials.find((s) => s.icon === "github")?.url ?? "",
  "socials.bilibili": siteConfig.socials.find((s) => s.icon === "bilibili")?.url ?? "",
  "socials.gitee": siteConfig.socials.find((s) => s.icon === "gitee")?.url ?? "",
  "socials.codeberg": siteConfig.socials.find((s) => s.icon === "codeberg")?.url ?? "",
  "socials.steam": siteConfig.socials.find((s) => s.icon === "steam")?.url ?? "",
  announcementMessage: "",
  announcementLink: "",
  announcementLinkText: "",
  "home.quote": "天高地迥，觉宇宙之无穷。",
  "home.quoteAuthor": "",
  "mascot.allowUserSwitch": "on",
  "mascot.showSwitchButton": "on",
  "mascot.defaultCharacter": "ram",
  "music.sourceMode": "deployed",
  "music.playlistId": "",
  "music.savedPlaylists": "[]",
  "music.lxApiUrl": "",
  "music.localTracks": "[]",
  "effects.playerWidget": "off",
  "effects.clickParticles": "off",
  "effects.textSparkle": "off",
  "effects.particles": "off",
  "effects.glow": "off",
};

const LABELS: Record<OverridableFields, string> = {
  name: "站点名 (title suffix)",
  title: "SEO 标题",
  description: "站点描述",
  "author.name": "作者名",
  "author.handle": "显示用户名",
  "author.bio": "个人简介",
  "author.avatar": "头像路径",
  "author.githubUsername": "GitHub 用户名",
  "author.githubUrl": "GitHub 主页链接",
  bangumiUserId: "Bangumi 用户 ID",
  "rss.title": "RSS 标题",
  "rss.description": "RSS 描述",
  "socials.github": "GitHub Profile 链接",
  "socials.bilibili": "Bilibili 链接",
  "socials.gitee": "Gitee 链接",
  "socials.codeberg": "Codeberg 链接",
  "socials.steam": "Steam 链接",
  announcementMessage: "公告文本（留空则不显示）",
  announcementLink: "公告链接",
  announcementLinkText: "链接按钮文字",
  "home.quote": "首页名句正文",
  "home.quoteAuthor": "首页名句作者",
  "mascot.allowUserSwitch": "允许访客切换看板娘 (on / off)",
  "mascot.showSwitchButton": "显示角色旁切换按钮 (on / off)",
  "mascot.defaultCharacter": "新访客默认看板娘 (ram / rem / kanna)",
  "music.sourceMode": "音乐音源模式 (deployed / lx / local)",
  "music.playlistId": "已部署音源歌单 ID",
  "music.savedPlaylists": "已保存歌单（JSON）",
  "music.lxApiUrl": "LX 音源 API URL 模板",
  "music.localTracks": "本地音源曲目（JSON）",
  "effects.playerWidget": "播放器小组件视觉特效",
  "effects.clickParticles": "点击粒子",
  "effects.textSparkle": "文字选中火花",
  "effects.particles": "粒子背景",
  "effects.glow": "光晕效果",
};

export const OVERRIDABLE_FIELDS = Object.entries(LABELS).map(
  ([key, label]) => ({ key: key as OverridableFields, label }),
);

let _cache: Map<string, string> | null = null;
let _cacheTs = 0;

function isProductionBuild(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

async function loadOverrides(): Promise<Map<string, string>> {
  const now = Date.now();
  if (_cache && now - _cacheTs < 60_000) return _cache;

  if (isProductionBuild()) {
    _cache = new Map();
    _cacheTs = now;
    return _cache;
  }

  try {
    const rows = await getDb().select().from(schema.siteOverrides);
    _cache = new Map(rows.map((r) => [r.key, r.value]));
  } catch (error) {
    console.warn("[site-config] failed to load overrides, using defaults:", error instanceof Error ? error.message : error);
    _cache = new Map();
  }
  _cacheTs = now;
  return _cache;
}

export async function getSiteOverride(key: OverridableFields): Promise<string> {
  const overrides = await loadOverrides();
  return overrides.get(key) ?? DEFAULT_MAP[key];
}

export async function getAllOverrides(): Promise<
  { key: OverridableFields; value: string; default: string }[]
> {
  const overrides = await loadOverrides();
  return OVERRIDABLE_FIELDS.map(({ key }) => ({
    key,
    value: overrides.get(key) ?? DEFAULT_MAP[key],
    default: DEFAULT_MAP[key],
  }));
}

export async function setSiteOverrides(
  entries: { key: OverridableFields; value: string }[],
): Promise<void> {
  const db = getDb();
  const now = new Date();
  for (const { key, value } of entries) {
    const trimmed = value.trim();
    if (!trimmed || trimmed === DEFAULT_MAP[key]) {
      await db
        .delete(schema.siteOverrides)
        .where(eq(schema.siteOverrides.key, key));
    } else {
      await db
        .insert(schema.siteOverrides)
        .values({ key, value: trimmed, updatedAt: now })
        .onConflictDoUpdate({
          target: schema.siteOverrides.key,
          set: { value: trimmed, updatedAt: now },
        });
    }
  }
  _cache = null;
}
