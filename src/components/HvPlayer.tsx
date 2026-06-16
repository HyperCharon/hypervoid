"use client";

import Image from "next/image";
import {
  ListMusic,
  Loader2,
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
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import type { MusicTrack } from "@/lib/music-types";

/* ── Types ─────────────────────────────────────────────── */
type LoopMode = "off" | "all" | "one";

/* ── Helpers ───────────────────────────────────────────── */
function fmt(sec: number) {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ── Component ─────────────────────────────────────────── */
export function HvPlayer({
  initialTracks,
  sourceLabel,
}: {
  initialTracks: MusicTrack[];
  sourceLabel: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>(initialTracks);
  const [loading, setLoading] = useState(initialTracks.length === 0);
  const [error, setError] = useState<string | null>(null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [muted, setMuted] = useState(false);
  const [loop, setLoop] = useState<LoopMode>("all");
  const [shuffle, setShuffle] = useState(false);
  const [showList, setShowList] = useState(false);
  const [buffering, setBuffering] = useState(false);

  /* ── Fetch tracks if empty ── */
  useEffect(() => {
    if (initialTracks.length > 0) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/music/playlist")
      .then((r) => (r.ok ? r.json() : r.json().then((d: { error?: string }) => { throw new Error(d.error || "HTTP " + r.status); })))
      .then((d: { tracks?: MusicTrack[]; source?: string }) => {
        if (cancelled) return;
        setTracks(Array.isArray(d.tracks) ? d.tracks : []);
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "获取歌单失败"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [initialTracks.length]);

  const playable = useMemo(
    () => tracks.filter((t): t is MusicTrack & { url: string } => Boolean(t.url)),
    [tracks],
  );
  const track = playable[currentIdx] ?? null;

  /* ── Audio element ── */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => {
    if (!track) return;
    const el = audioRef.current;
    if (!el) return;
    el.src = track.url;
    if (playing) el.play().catch(() => {});
  }, [track?.url]);

  /* ── Audio events ── */
  const onTimeUpdate = useCallback(() => {
    const el = audioRef.current;
    if (el) setProgress(el.currentTime);
  }, []);

  const onLoadedMetadata = useCallback(() => {
    const el = audioRef.current;
    if (el) setDuration(el.duration);
  }, []);

  const onEnded = useCallback(() => {
    if (loop === "one") {
      const el = audioRef.current;
      if (el) { el.currentTime = 0; el.play().catch(() => {}); }
      return;
    }
    goNext();
  }, [loop, shuffle, currentIdx, playable.length]);

  const onWaiting = useCallback(() => setBuffering(true), []);
  const onCanPlay = useCallback(() => setBuffering(false), []);

  /* ── Controls ── */
  function togglePlay() {
    const el = audioRef.current;
    if (!el || !track) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play().catch(() => {}); setPlaying(true); }
  }

  function goNext() {
    if (playable.length === 0) return;
    if (shuffle) {
      let idx = Math.floor(Math.random() * playable.length);
      if (idx === currentIdx && playable.length > 1) idx = (idx + 1) % playable.length;
      setCurrentIdx(idx);
    } else {
      setCurrentIdx((i) => (i + 1) % playable.length);
    }
    setPlaying(true);
  }

  function goPrev() {
    if (playable.length === 0) return;
    const el = audioRef.current;
    if (el && el.currentTime > 3) { el.currentTime = 0; return; }
    setCurrentIdx((i) => (i - 1 + playable.length) % playable.length);
    setPlaying(true);
  }

  function seek(e: ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    const el = audioRef.current;
    if (el) { el.currentTime = v; setProgress(v); }
  }

  function changeVolume(e: ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setVolume(v);
    setMuted(v === 0);
  }

  function toggleMute() {
    setMuted((m) => !m);
  }

  function cycleLoop() {
    setLoop((l) => (l === "off" ? "all" : l === "all" ? "one" : "off"));
  }

  function playIndex(i: number) {
    setCurrentIdx(i);
    setPlaying(true);
    setShowList(false);
  }

  /* ── Loading / error / empty ── */
  if (loading) return <Skeleton />;
  if (error) return <Empty msg={error} />;
  if (playable.length === 0) return <Empty msg="当前音源没有可播放曲目。去后台「音乐设置」切换音源。" />;

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <section className="hv-card overflow-hidden">
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onWaiting={onWaiting}
        onCanPlay={onCanPlay}
      />

      {/* ── Main area ── */}
      <div className="flex flex-col gap-0 sm:flex-row">
        {/* Cover */}
        <div className="relative h-52 w-full shrink-0 overflow-hidden sm:h-auto sm:w-52 md:w-60">
          {track?.cover ? (
            <Image
              src={track.cover}
              alt=""
              fill
              sizes="(min-width: 640px) 240px, 100vw"
              className="object-cover transition-opacity duration-300"
              unoptimized
            />
          ) : (
            <div className="grid h-full place-items-center bg-gradient-to-br from-accent/15 to-accent/5">
              <Music2 className="h-12 w-12 text-accent/40" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent sm:bg-gradient-to-r" />
        </div>

        {/* Controls area */}
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
          {/* Track info */}
          <div>
            <h3 className="truncate text-lg font-bold tracking-tight text-foreground">
              {track?.title ?? "未知曲目"}
            </h3>
            <p className="mt-0.5 truncate text-sm text-muted">
              {track?.artist ?? "未知艺术家"}
            </p>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <span className="w-10 text-right font-mono text-[11px] text-muted-soft tabular-nums">
              {fmt(progress)}
            </span>
            <div className="relative flex-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/40">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-100"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={progress}
                onChange={seek}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="播放进度"
              />
            </div>
            <span className="w-10 font-mono text-[11px] text-muted-soft tabular-nums">
              {fmt(duration)}
            </span>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: shuffle + loop */}
            <div className="flex items-center gap-1">
              <CtrlBtn
                active={shuffle}
                onClick={() => setShuffle((s) => !s)}
                icon={<Shuffle className="h-4 w-4" />}
                label="随机播放"
              />
              <CtrlBtn
                active={loop !== "off"}
                onClick={cycleLoop}
                icon={loop === "one" ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
                label={loop === "off" ? "循环关闭" : loop === "all" ? "列表循环" : "单曲循环"}
              />
            </div>

            {/* Center: prev / play / next */}
            <div className="flex items-center gap-1">
              <CtrlBtn onClick={goPrev} icon={<SkipBack className="h-4 w-4" />} label="上一首" />
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "暂停" : "播放"}
                className="grid h-11 w-11 place-items-center rounded-full bg-accent text-primary-foreground transition hover:brightness-110 active:scale-95"
              >
                {buffering ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : playing ? (
                  <Pause className="h-5 w-5" fill="currentColor" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
                )}
              </button>
              <CtrlBtn onClick={goNext} icon={<SkipForward className="h-4 w-4" />} label="下一首" />
            </div>

            {/* Right: volume + playlist */}
            <div className="flex items-center gap-1">
              <div className="hidden items-center gap-1.5 sm:flex">
                <CtrlBtn
                  onClick={toggleMute}
                  icon={muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  label={muted ? "取消静音" : "静音"}
                />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={muted ? 0 : volume}
                  onChange={changeVolume}
                  className="hv-volume-slider h-1 w-16 cursor-pointer accent-accent"
                  aria-label="音量"
                />
              </div>
              <CtrlBtn
                active={showList}
                onClick={() => setShowList((s) => !s)}
                icon={<ListMusic className="h-4 w-4" />}
                label="播放列表"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Playlist ── */}
      {showList ? (
        <div className="border-t border-border">
          <div className="max-h-64 overflow-y-auto">
            {playable.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => playIndex(i)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-card-hover ${
                  i === currentIdx ? "bg-accent/10 text-accent" : "text-foreground"
                }`}
              >
                <span className="w-5 shrink-0 text-center font-mono text-[11px] text-muted-soft">
                  {i === currentIdx && playing ? (
                    <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-accent" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                <span className="shrink-0 text-muted-soft">{t.artist}</span>
                <span className="w-10 shrink-0 text-right font-mono text-[11px] text-muted-soft">
                  {fmt(t.duration)}
                </span>
              </button>
            ))}
          </div>
          {playable.length < tracks.length ? (
            <p className="border-t border-border px-4 py-2 text-xs text-muted-soft">
              {tracks.length - playable.length} 首因无播放地址已隐藏
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Source label */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-soft">
        <span>音源：{sourceLabel}</span>
        <span>{playable.length} 首可播放</span>
      </div>
    </section>
  );
}

/* ── Sub-components ────────────────────────────────────── */
function CtrlBtn({
  icon,
  onClick,
  active,
  label,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 place-items-center rounded-lg transition hover:bg-card-hover ${
        active ? "text-accent" : "text-muted-soft hover:text-foreground"
      }`}
    >
      {icon}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="hv-card overflow-hidden">
      <div className="flex flex-col gap-0 sm:flex-row">
        <div className="h-52 w-full shrink-0 animate-pulse bg-border/20 sm:h-auto sm:w-52 md:w-60" />
        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="h-5 w-40 animate-pulse rounded bg-border/20" />
          <div className="h-4 w-28 animate-pulse rounded bg-border/15" />
          <div className="h-1.5 w-full animate-pulse rounded-full bg-border/20" />
          <div className="flex justify-center gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 w-9 animate-pulse rounded-lg bg-border/15" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="hv-card flex flex-col items-center gap-3 p-6 text-center sm:p-8 lg:p-10">
      <Music2 className="h-10 w-10 text-muted-soft/40" />
      <p className="text-sm text-muted">{msg}</p>
    </div>
  );
}
