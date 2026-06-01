"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import type { MusicTrack } from "@/lib/music-types";

type APlayerAudio = {
  name: string;
  artist: string;
  url: string;
  cover?: string;
  lrc?: string;
  theme?: string;
};

type APlayerInstance = {
  destroy: () => void;
};

type APlayerConstructor = new (options: {
  container: HTMLElement;
  audio: APlayerAudio[];
  fixed?: boolean;
  autoplay?: boolean;
  theme?: string;
  loop?: "all" | "one" | "none";
  order?: "list" | "random";
  preload?: "auto" | "metadata" | "none";
  volume?: number;
  mutex?: boolean;
  listFolded?: boolean;
  listMaxHeight?: string;
  lrcType?: number;
}) => APlayerInstance;

type PlaylistResponse = {
  tracks?: MusicTrack[];
  source?: string;
  error?: string;
};

async function loadAPlayer(): Promise<APlayerConstructor> {
  const mod = await import("aplayer");
  return (mod.default ?? mod) as APlayerConstructor;
}

export function APlayerMusicPlayer({
  initialTracks,
  sourceLabel,
}: {
  initialTracks: MusicTrack[];
  sourceLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<APlayerInstance | null>(null);
  const { resolvedTheme } = useTheme();
  const [tracks, setTracks] = useState<MusicTrack[]>(initialTracks);
  const [loading, setLoading] = useState(initialTracks.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [clientSourceLabel, setClientSourceLabel] = useState(sourceLabel);

  const themeColor = resolvedTheme === "light" ? "#0d9488" : "#3b82f6";

  useEffect(() => {
    if (initialTracks.length > 0) return;
    let cancelled = false;

    setLoading(true);
    fetch("/api/music/playlist")
      .then((res) =>
        res.ok
          ? res.json()
          : res.json().then((data: PlaylistResponse) => {
              throw new Error(data.error || "HTTP " + res.status);
            }),
      )
      .then((data: PlaylistResponse) => {
        if (cancelled) return;
        setTracks(Array.isArray(data.tracks) ? data.tracks : []);
        if (data.source) setClientSourceLabel(data.source);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "获取歌单失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialTracks.length]);

  const playableTracks = useMemo(
    () => tracks.filter((track): track is MusicTrack & { url: string } => Boolean(track.url)),
    [tracks],
  );

  const audio = useMemo<APlayerAudio[]>(
    () =>
      playableTracks.map((track) => ({
        name: track.title,
        artist: track.artist,
        url: track.url,
        cover: track.cover || undefined,
        lrc: track.lrc,
        theme: themeColor,
      })),
    [playableTracks, themeColor],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || audio.length === 0) return;

    let cancelled = false;

    loadAPlayer()
      .then((APlayer) => {
        if (cancelled || !containerRef.current) return;
        playerRef.current?.destroy();
        playerRef.current = new APlayer({
          container,
          audio,
          theme: themeColor,
          loop: "all",
          order: "list",
          preload: "metadata",
          volume: 0.75,
          mutex: true,
          listFolded: false,
          listMaxHeight: "360px",
          lrcType: audio.some((item) => item.lrc) ? 1 : 0,
        });
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "播放器加载失败");
        }
      });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [audio]);

  const skippedCount = tracks.length - playableTracks.length;

  if (loading) {
    return (
      <section className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted">
        加载歌单中……
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted">
        {error}
      </section>
    );
  }

  if (tracks.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
        当前音源没有返回曲目。去后台「音乐设置」切换音源或补充本地歌单。
      </section>
    );
  }

  if (playableTracks.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted">
        当前音源返回了曲目信息，但没有可播放地址。请在后台切换到 LX 或本地音源，
        或检查已部署音源的 Cookie / 权限状态。
      </section>
    );
  }

  return (
    <section className="hypervoid-aplayer rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>当前音源：{clientSourceLabel}</span>
        <span>
          可播放 {playableTracks.length} / 已载入 {tracks.length}
        </span>
      </div>
      <div ref={containerRef} />
      {skippedCount > 0 ? (
        <p className="mt-3 text-xs text-muted">
          {skippedCount} 首因版权、地区、Cookie 或音源字段缺失未拿到播放地址，已从 APlayer 列表隐藏。
        </p>
      ) : null}
    </section>
  );
}
