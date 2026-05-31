"use client";

import {
  ArrowRight,
  ChevronDown,
  Music2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useStateCtx, useTimeCtx, useActions } from "@/components/PlayerProvider";

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
  try {
    return localStorage.getItem(OPEN_KEY) === "true";
  } catch {
    return false;
  }
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** Seed a deterministic pseudo-random height array from a number. */
function waveformBars(seed: number, count: number): number[] {
  const bars: number[] = [];
  let s = seed || 1;
  for (let i = 0; i < count; i++) {
    s = (s * 16807 + 12345) % 2147483647;
    bars.push(0.3 + (s % 71) / 100);
  }
  return bars;
}

const BAR_COUNT = 32;

export function HomePlayerWidget() {
  const { loading, tracksLoaded, error } = useStateCtx();
  const {
    current,
    playing,
    currentTime,
    duration,
    togglePlay,
    next,
    prev,
    seek,
  } = useTimeCtx();
  const { ensureTracksLoaded } = useActions();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [saying, setSaying] = useState("");
  const [fxEnabled, setFxEnabled] = useState(false);

  const refreshSaying = useCallback(() => {
    if (typeof window === "undefined") return;
    const day = Math.floor(Date.now() / 86_400_000);
    setSaying(SAYINGS[day % SAYINGS.length]);
  }, []);

  useEffect(() => {
    setOpen(loadOpen());
    setMounted(true);
    refreshSaying();
    fetch("/api/effects")
      .then((r) => r.json())
      .then((d) => setFxEnabled(Boolean(d.playerWidget)))
      .catch(() => {});
  }, [refreshSaying]);

  const toggleOpen = () => {
    setOpen((prevOpen) => {
      const nextOpen = !prevOpen;
      try {
        localStorage.setItem(OPEN_KEY, String(nextOpen));
      } catch {
        /* noop */
      }
      if (nextOpen) {
        void ensureTracksLoaded();
      }
      return nextOpen;
    });
  };

  const bars = useMemo(
    () => waveformBars(current?.id ?? 0, BAR_COUNT),
    [current?.id],
  );

  const progressPct =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    seek(pct * duration);
  };

  if (!mounted) return null;

  return (
    <aside
      className="hv-panel-sci group relative overflow-hidden p-3"
    >
      {/* Ambient blurred cover backdrop — only when effects enabled */}
      {fxEnabled && open && current?.cover ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.cover}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full scale-150 object-cover opacity-25 blur-2xl saturate-150 transition-opacity duration-700"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-slate-950/72 to-slate-950" />
        </>
      ) : null}

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-baseline justify-between">
          <h3 className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-foreground/80">
            <Music2 className="h-3.5 w-3.5 text-accent/76" aria-hidden />
            音乐播放器
          </h3>
          <div className="flex items-center gap-1.5">
            <Link
              href="/music"
              className="group inline-flex items-center gap-1 border border-border bg-card px-2.5 py-0.5 font-mono text-xs uppercase tracking-wider text-muted transition hover:border-accent/40 hover:bg-card-hover hover:text-accent"
            >
              完整版
              <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <button
              type="button"
              onClick={toggleOpen}
              aria-expanded={open}
              aria-label={open ? "收起播放器" : "展开播放器"}
              className="grid h-6 w-6 place-items-center border border-border bg-card text-muted transition hover:border-accent/40 hover:text-accent"
            >
              <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
            </button>
          </div>
        </div>

        {/* Collapsed: daily saying */}
        {!open ? (
          <p
            onClick={toggleOpen}
            className="mt-2 cursor-pointer border border-border bg-card px-2 py-2 text-center font-mono text-xs italic leading-relaxed text-muted transition-colors hover:border-border hover:text-foreground"
          >
            「{saying || "音乐是灵魂的避难所。"}」
          </p>
        ) : null}

        {/* Expanded: player */}
        {open ? (
          <div className="mt-3">
            {loading && !tracksLoaded ? (
              <p className="border border-dashed border-border bg-card px-3 py-4 text-center text-xs text-muted backdrop-blur-sm">
                加载歌单中…
              </p>
            ) : error && !tracksLoaded ? (
              <p className="border border-dashed border-border bg-card px-3 py-4 text-center text-xs text-muted backdrop-blur-sm">
                {error}
              </p>
            ) : !current ? (
              <div className="border border-dashed border-border bg-card px-3 py-4 text-center backdrop-blur-sm">
                <p className="mb-2 text-xs text-muted">
                  暂无可播放曲目。
                </p>
                <p
                  className="text-[11px] leading-relaxed text-muted-soft"
                  style={{ fontFamily: "Georgia, 'Noto Serif SC', serif" }}
                >
                  {saying}
                </p>
              </div>
            ) : (
              <>
                {/* Album art + info */}
                <div className="flex items-center gap-3">
                  {current.cover ? (
                    <div className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={current.cover}
                        alt={current.title}
                        className={`object-cover shadow-sm ${
                          fxEnabled
                            ? `h-14 w-14 rounded-full shadow-lg ring-1 ring-black/5 dark:ring-white/10 ${
                                playing ? "animate-[spin_20s_linear_infinite]" : ""
                              }`
                            : `h-12 w-12 rounded-full ${
                                playing ? "animate-[spin_20s_linear_infinite]" : ""
                              }`
                        }`}
                        style={{
                          animationPlayState: playing ? "running" : "paused",
                        }}
                      />
                      {/* Glow effect — only when effects enabled */}
                      {fxEnabled && playing ? (
                        <div className="absolute -inset-1 -z-10 rounded-full bg-accent/15 blur-md" />
                      ) : null}
                    </div>
                  ) : (
                    <div
                      className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-accent/16 to-card/35 ${
                        fxEnabled
                          ? "h-14 w-14 rounded-full text-2xl shadow-[0_0_18px_var(--accent-glow)] ring-1 ring-accent/20"
                          : "h-12 w-12 rounded-full text-xl text-muted"
                      }`}
                    >
                      ♪
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-semibold tracking-tight"
                      title={current.title}
                    >
                      {current.title}
                    </p>
                    <p
                      className="mt-0.5 truncate text-xs text-muted"
                      title={current.artist}
                    >
                      {current.artist}
                    </p>
                  </div>
                </div>

                {/* Progress bar — waveform when effects on, simple when off */}
                {fxEnabled ? (
                  <div className="mt-3">
                    <div
                      className="flex h-8 cursor-pointer items-end gap-[2px]"
                      onClick={handleBarClick}
                      role="slider"
                      aria-label="播放进度"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(progressPct)}
                    >
                      {bars.map((h, i) => {
                        const barPct = ((i + 0.5) / BAR_COUNT) * 100;
                        const filled = barPct <= progressPct;
                        return (
                          <div
                            key={i}
                            className={`flex-1 rounded-full transition-colors duration-150 ${
                              filled ? "bg-accent" : "bg-border"
                            }`}
                            style={{ height: `${h * 100}%` }}
                          />
                        );
                      })}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-mono text-xs text-muted-soft">
                        {formatTime(currentTime)}
                      </span>
                      <span className="font-mono text-xs text-muted-soft">
                        {formatTime(duration)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="w-8 text-right font-mono text-xs text-muted-soft">
                      {formatTime(currentTime)}
                    </span>
                    <div className="relative h-1 flex-1 bg-border">
                      <div
                        className="absolute left-0 top-0 h-full bg-accent transition-[width] duration-200"
                        style={{
                          width:
                            duration > 0
                              ? `${Math.min(100, (currentTime / duration) * 100)}%`
                              : "0%",
                        }}
                      />
                    </div>
                    <span className="w-8 font-mono text-xs text-muted-soft">
                      {formatTime(duration)}
                    </span>
                  </div>
                )}

                {/* Controls */}
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="上一首"
                    className="grid h-8 w-8 place-items-center border border-transparent text-muted transition hover:border-border hover:bg-card hover:text-foreground"
                  >
                    <SkipBack className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={togglePlay}
                    disabled={!current?.url}
                    aria-label={playing ? "暂停" : "播放"}
                    className="grid h-10 w-10 place-items-center border border-accent/50 bg-accent text-background shadow-[0_0_18px_var(--accent-glow)] transition hover:bg-accent-soft disabled:opacity-40"
                  >
                    {playing ? (
                      <Pause className="h-4 w-4" aria-hidden />
                    ) : (
                      <Play className="ml-0.5 h-4 w-4" aria-hidden />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="下一首"
                    className="grid h-8 w-8 place-items-center border border-transparent text-muted transition hover:border-border hover:bg-card hover:text-foreground"
                  >
                    <SkipForward className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
