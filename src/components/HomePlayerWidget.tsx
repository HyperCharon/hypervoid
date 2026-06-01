"use client";

import {
  ChevronDown,
  ListMusic,
  Music2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useState, useCallback, type ChangeEvent } from "react";
import Image from "next/image";
import { useStateCtx, useTimeCtx, useActions } from "@/components/PlayerProvider";
import type { RepeatMode } from "@/components/PlayerProvider";

const OPEN_KEY = "hypervoid:home-player:open";

const SAYINGS = [
  "音乐是灵魂的避难所。",
  "每一个音符都是星辰。",
  "闭上眼睛，世界就安静了。",
  "在旋律中遇见另一个自己。",
  "耳机是通往另一个世界的入口。",
  "听见风的声音，也听见自己。",
  "无需言语，只需聆听。",
  "音乐是时间的艺术。",
];

function loadOpen(): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(OPEN_KEY) === "true"; } catch { return false; }
}

function fmt(ms: number): string {
  if (!ms) return "0:00";
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function HomePlayerWidget() {
  const { loading, tracksLoaded, error, tracks, currentIdx, volume, muted, repeatMode, shuffle } = useStateCtx();
  const { current, playing, currentTime, duration, togglePlay, next, prev, seek } = useTimeCtx();
  const { ensureTracksLoaded, setVolume, toggleMute, toggleShuffle, cycleRepeat, playAt } = useActions();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [saying, setSaying] = useState("");
  const [showList, setShowList] = useState(false);

  const refreshSaying = useCallback(() => {
    if (typeof window === "undefined") return;
    setSaying(SAYINGS[Math.floor(Date.now() / 86_400_000) % SAYINGS.length]);
  }, []);

  useEffect(() => {
    setOpen(loadOpen());
    setMounted(true);
    refreshSaying();
  }, [refreshSaying]);

  const toggleOpen = () => {
    setOpen((v) => {
      const n = !v;
      try { localStorage.setItem(OPEN_KEY, String(n)); } catch {}
      if (n) void ensureTracksLoaded();
      return n;
    });
  };

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  function handleBarClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - rect.left) / rect.width) * duration);
  }

  function onVolumeChange(e: ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setVolume(v);
  }

  const playable = tracks.filter((t) => Boolean(t.url));

  if (!mounted) return null;

  return (
    <aside className="hv-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
        <h3 className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">
          <Music2 className="h-3.5 w-3.5 text-accent" aria-hidden />
          正在播放
        </h3>
        <button
          type="button"
          onClick={toggleOpen}
          aria-expanded={open}
          aria-label={open ? "收起" : "展开"}
          className="grid h-6 w-6 place-items-center rounded-md text-muted-soft transition hover:bg-card-hover hover:text-accent"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </div>

      {/* Collapsed */}
      {!open ? (
        <p onClick={toggleOpen} className="cursor-pointer px-3.5 py-3 text-center text-xs text-muted-soft transition hover:text-foreground">
          {saying || "音乐是灵魂的避难所。"}
        </p>
      ) : null}

      {/* Expanded */}
      {open ? (
        <div className="p-3.5">
          {loading && !tracksLoaded ? (
            <p className="py-4 text-center text-xs text-muted">加载歌单中…</p>
          ) : error && !tracksLoaded ? (
            <p className="py-4 text-center text-xs text-muted">{error}</p>
          ) : !current ? (
            <p className="py-4 text-center text-xs text-muted">暂无可播放曲目</p>
          ) : (
            <>
              {/* Cover + info */}
              <div className="flex items-center gap-3">
                {current.cover ? (
                  <Image src={current.cover} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-lg object-cover" unoptimized />
                ) : (
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent"><Music2 className="h-4 w-4" /></div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{current.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">{current.artist}</p>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-3">
                <div className="group relative h-1.5 cursor-pointer overflow-hidden rounded-full bg-border/40" onClick={handleBarClick} role="slider" aria-label="播放进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progressPct)}>
                  <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-muted-soft tabular-nums">
                  <span>{fmt(currentTime)}</span>
                  <span>{fmt(duration)}</span>
                </div>
              </div>

              {/* Main controls */}
              <div className="mt-2 flex items-center justify-center gap-1">
                <Btn onClick={prev} label="上一首"><SkipBack className="h-3.5 w-3.5" /></Btn>
                <button type="button" onClick={togglePlay} disabled={!current?.url} aria-label={playing ? "暂停" : "播放"}
                  className="grid h-9 w-9 place-items-center rounded-full bg-accent text-primary-foreground transition hover:brightness-110 active:scale-95 disabled:opacity-40">
                  {playing ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4 ml-0.5" fill="currentColor" />}
                </button>
                <Btn onClick={next} label="下一首"><SkipForward className="h-3.5 w-3.5" /></Btn>
              </div>

              {/* Secondary row: shuffle, repeat, volume, playlist */}
              <div className="mt-2.5 flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  <Btn small active={shuffle} onClick={toggleShuffle} label="随机"><Shuffle className="h-3.5 w-3.5" /></Btn>
                  <Btn small active={repeatMode !== "off"} onClick={cycleRepeat} label={repeatMode === "off" ? "循环关" : repeatMode === "all" ? "列表循环" : "单曲循环"}>
                    {repeatMode === "one" ? <Repeat1 className="h-3.5 w-3.5" /> : <Repeat className="h-3.5 w-3.5" />}
                  </Btn>
                </div>

                <div className="flex items-center gap-1">
                  {/* Volume */}
                  <div className="flex items-center gap-1">
                    <Btn small onClick={toggleMute} label={muted ? "取消静音" : "静音"}>
                      {muted || volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    </Btn>
                    <input type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume} onChange={onVolumeChange}
                      className="hv-volume-slider h-1 w-14 cursor-pointer accent-accent" aria-label="音量" />
                  </div>

                  {/* Playlist toggle */}
                  <Btn small active={showList} onClick={() => setShowList((s) => !s)} label="播放列表">
                    <ListMusic className="h-3.5 w-3.5" />
                  </Btn>
                </div>
              </div>

              {/* Playlist */}
              {showList && playable.length > 0 ? (
                <div className="mt-2.5 max-h-40 overflow-y-auto rounded-lg border border-border">
                  {playable.map((t, i) => (
                    <button key={t.id} type="button" onClick={() => playAt(i)}
                      className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition hover:bg-card-hover ${i === currentIdx ? "bg-accent/10 text-accent" : "text-foreground"}`}>
                      <span className="w-4 shrink-0 text-center font-mono text-[10px] text-muted-soft">
                        {i === currentIdx && playing ? <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" /> : i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{t.title}</span>
                      <span className="shrink-0 text-muted-soft">{fmt(t.duration)}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </aside>
  );
}

/* ── Small button ── */
function Btn({ children, onClick, active, label, small }: {
  children: React.ReactNode; onClick: () => void; active?: boolean; label: string; small?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className={`grid place-items-center rounded-lg transition hover:bg-card-hover ${small ? "h-7 w-7" : "h-8 w-8"} ${active ? "text-accent" : "text-muted-soft hover:text-foreground"}`}>
      {children}
    </button>
  );
}
