import "server-only";

import { lookup } from "node:dns/promises";
import { getSiteOverride } from "@/lib/site-config-server";
import { getPlaylistWithUrls } from "@/lib/ncm";
import type { MusicTrack } from "@/lib/music-types";

const PRIVATE_IP_RE =
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.|0\.|::1|fc[0-9a-f]{2}:|fe[89ab][0-9a-f]:|localhost)/i;

export type MusicSourceMode = "deployed" | "lx" | "local";


export const MUSIC_SOURCE_LABEL: Record<MusicSourceMode, string> = {
  deployed: "已部署音源",
  lx: "LX 音源",
  local: "本地音源",
};

export type MusicSourceConfig = {
  mode: MusicSourceMode;
  playlistId: string;
  lxApiUrl: string;
  localTracksRaw: string;
};

function normalizeMode(value: string): MusicSourceMode {
  return value === "lx" || value === "local" ? value : "deployed";
}

export async function getMusicSourceConfig(): Promise<MusicSourceConfig> {
  const [mode, playlistId, lxApiUrl, localTracksRaw] = await Promise.all([
    getSiteOverride("music.sourceMode"),
    getSiteOverride("music.playlistId"),
    getSiteOverride("music.lxApiUrl"),
    getSiteOverride("music.localTracks"),
  ]);
  return {
    mode: normalizeMode(mode),
    playlistId: playlistId.trim(),
    lxApiUrl: lxApiUrl.trim(),
    localTracksRaw,
  };
}

function stableNumericId(input: unknown, fallback: number): number {
  if (typeof input === "number" && Number.isFinite(input)) return input;
  if (typeof input === "string" && /^\d+$/.test(input.trim())) {
    return Number(input.trim());
  }
  const s = String(input ?? fallback);
  let hash = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash || fallback);
}

function normalizeDuration(value: unknown): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n < 10_000 ? Math.round(n * 1000) : Math.round(n);
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value)) {
      const joined = value
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "name" in item) {
            return String((item as { name?: unknown }).name ?? "");
          }
          return "";
        })
        .filter(Boolean)
        .join(" / ");
      if (joined) return joined;
    }
  }
  return "";
}

function normalizeTrack(input: unknown, index: number): MusicTrack | null {
  if (!input || typeof input !== "object") return null;
  const item = input as Record<string, unknown>;
  const title = pickString(item.title, item.name, item.songName, item.songname);
  const artist = pickString(item.artist, item.author, item.singer, item.singers, item.ar, item.creator);
  const url = pickString(item.url, item.src, item.source, item.playUrl, item.play_url);
  if (!title || !url) return null;
  return {
    id: stableNumericId(item.id ?? item.mid ?? item.songmid ?? item.hash ?? url, index + 1),
    title,
    artist: artist || "Unknown Artist",
    cover: pickString(item.cover, item.pic, item.picUrl, item.img, item.image, item.albumPic) || "",
    duration: normalizeDuration(item.duration ?? item.interval ?? item.dt ?? item.time),
    url,
    lrc: pickString(item.lrc, item.lyric) || undefined,
  };
}

function extractTrackArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  const root = data as Record<string, unknown>;
  const candidates = [
    root.tracks,
    root.list,
    root.songs,
    root.data,
    root.result,
    root.playlist,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      if (Array.isArray(nested.tracks)) return nested.tracks;
      if (Array.isArray(nested.list)) return nested.list;
      if (Array.isArray(nested.songs)) return nested.songs;
    }
  }
  return [];
}

export function parseLocalMusicTracks(raw: string): MusicTrack[] {
  if (!raw.trim()) return [];
  const parsed = JSON.parse(raw) as unknown;
  return extractTrackArray(parsed)
    .map(normalizeTrack)
    .filter((track): track is MusicTrack => Boolean(track));
}

function buildLxUrl(template: string, playlistId: string): string {
  if (!template) return "";
  if (template.includes("{playlistId}")) {
    return template.replaceAll("{playlistId}", encodeURIComponent(playlistId));
  }
  if (!playlistId) return template;
  const url = new URL(template);
  if (!url.searchParams.has("id") && !url.searchParams.has("playlistId")) {
    url.searchParams.set("id", playlistId);
  }
  return url.toString();
}

async function getLxTracks(config: MusicSourceConfig): Promise<MusicTrack[]> {
  const url = buildLxUrl(config.lxApiUrl, config.playlistId);
  if (!url) return [];

  // SSRF guard: reject private/internal IPs even after DNS resolution.
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return [];
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return [];
  if (PRIVATE_IP_RE.test(parsed.hostname)) return [];
  try {
    const { address } = await lookup(parsed.hostname);
    if (PRIVATE_IP_RE.test(address)) return [];
  } catch {
    // DNS failure — let the fetch fail naturally.
  }

  const res = await fetch(url, {
    headers: {
      Accept: "application/json,text/plain,*/*",
      "User-Agent": "HypervoidMusic/1.0",
    },
    next: { revalidate: 180 },
  });
  if (!res.ok) throw new Error("LX source HTTP " + res.status);
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("json") ? await res.json() : JSON.parse(await res.text());
  return extractTrackArray(data)
    .map(normalizeTrack)
    .filter((track): track is MusicTrack => Boolean(track));
}

export async function getConfiguredMusicTracks(): Promise<MusicTrack[]> {
  const config = await getMusicSourceConfig();
  if (config.mode === "local") {
    return parseLocalMusicTracks(config.localTracksRaw);
  }
  if (config.mode === "lx") {
    return getLxTracks(config);
  }
  if (!config.playlistId) return [];
  return getPlaylistWithUrls(config.playlistId);
}
