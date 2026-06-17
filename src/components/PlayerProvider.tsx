"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type Track = {
  id: number;
  title: string;
  artist: string;
  cover: string;
  duration: number; // ms
  url: string | null;
};

export type RepeatMode = "off" | "all" | "one";

/* ─── State context (stable — tracks, settings, loading) ─── */

type PlayerState = {
  tracks: Track[];
  currentIdx: number;
  volume: number;
  muted: boolean;
  repeatMode: RepeatMode;
  shuffle: boolean;
  tracksLoaded: boolean;
  loading: boolean;
  error: string | null;
};

const StateCtx = createContext<PlayerState | null>(null);

/* ─── Time context (updates every ~200 ms while playing) ─── */

type PlayerTime = {
  current: Track | null;
  playing: boolean;
  currentTime: number; // ms
  duration: number; // ms
  seek: (ms: number) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
};

const TimeCtx = createContext<PlayerTime | null>(null);

/* ─── Actions context (stable — all callbacks) ─── */

type PlayerActions = {
  ensureTracksLoaded: () => Promise<void>;
  setTracks: (tracks: Track[]) => void;
  playAt: (idx: number) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (ms: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
};

const ActionsCtx = createContext<PlayerActions | null>(null);

/* ─── Legacy combined hook (use sparingly) ─── */

type PlayerContextValue = PlayerState & PlayerTime & PlayerActions;
const PlayerContext = createContext<PlayerContextValue | null>(null);

/* ─── Persistence helpers ─── */

const VOLUME_KEY = "hypervoid:player:volume";
const MUTED_KEY = "hypervoid:player:muted";
const REPEAT_KEY = "hypervoid:player:repeat";
const SHUFFLE_KEY = "hypervoid:player:shuffle";

function loadFloat(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

function loadBool(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw === "true";
  } catch {
    return fallback;
  }
}

function firstPlayableIndex(tracks: Track[]): number {
  const idx = tracks.findIndex((t) => Boolean(t.url));
  return idx >= 0 ? idx : 0;
}

function nextPlayableIndex(
  tracks: Track[],
  currentIdx: number,
  direction: 1 | -1,
): number {
  if (tracks.length === 0) return 0;
  const hasPlayable = tracks.some((t) => Boolean(t.url));
  if (!hasPlayable) return currentIdx;
  for (let step = 1; step <= tracks.length; step += 1) {
    const idx =
      (currentIdx + direction * step + tracks.length) % tracks.length;
    if (tracks[idx]?.url) return idx;
  }
  return currentIdx;
}

function loadRepeat(): RepeatMode {
  if (typeof window === "undefined") return "off";
  try {
    const raw = localStorage.getItem(REPEAT_KEY);
    return raw === "all" || raw === "one" ? raw : "off";
  } catch {
    return "off";
  }
}

/* ─── Provider ─── */

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shuffleOrderRef = useRef<number[]>([]);
  const shuffleCursorRef = useRef(0);
  const lastTimeUpdateRef = useRef(0);

  const [tracks, setTracksState] = useState<Track[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [shuffle, setShuffle] = useState(false);
  const [tracksLoaded, setTracksLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore persisted settings once on mount
  useEffect(() => {
    setVolumeState(loadFloat(VOLUME_KEY, 0.7));
    setMuted(loadBool(MUTED_KEY, false));
    setRepeatMode(loadRepeat());
    setShuffle(loadBool(SHUFFLE_KEY, false));
  }, []);

  // Lazy-create the singleton audio element
  useEffect(() => {
    if (audioRef.current) return;
    const a = new Audio();
    a.preload = "metadata";
    a.volume = volume;
    a.muted = muted;
    audioRef.current = a;
    return () => {
      a.pause();
      a.src = "";
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync volume/muted into audio element
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    try {
      localStorage.setItem(VOLUME_KEY, String(volume));
    } catch {
      /* noop */
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
    try {
      localStorage.setItem(MUTED_KEY, String(muted));
    } catch {
      /* noop */
    }
  }, [muted]);

  // Persist mode toggles
  useEffect(() => {
    try {
      localStorage.setItem(REPEAT_KEY, repeatMode);
    } catch {
      /* noop */
    }
  }, [repeatMode]);

  useEffect(() => {
    try {
      localStorage.setItem(SHUFFLE_KEY, String(shuffle));
    } catch {
      /* noop */
    }
  }, [shuffle]);

  // Build (or rebuild) the shuffle order whenever tracks or shuffle toggles
  useEffect(() => {
    if (!shuffle || tracks.length === 0) {
      shuffleOrderRef.current = [];
      shuffleCursorRef.current = 0;
      return;
    }
    const order = tracks
      .map((track, i) => (track.url ? i : -1))
      .filter((i) => i >= 0 && i !== currentIdx);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    shuffleOrderRef.current = order;
    shuffleCursorRef.current = 0;
  }, [shuffle, tracks, currentIdx]);

  const current = tracks[currentIdx] ?? null;

  const setTracks = useCallback((next: Track[]) => {
    setTracksState(next);
    setTracksLoaded(true);
    setCurrentIdx(firstPlayableIndex(next));
    if (next.length > 0 && !next.some((t) => t.url)) {
      setError("曲目信息已获取，但没有可播放音源。请在后台音乐设置切换音源，或检查 Cookie / 本地 JSON 配置。");
    }
  }, []);

  const ensureTracksLoaded = useCallback(async () => {
    if (tracksLoaded || loading) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/music/playlist");
      if (!r.ok) {
        const j = await r.json().catch(() => null);
        throw new Error(j?.error ?? `HTTP ${r.status}`);
      }
      const data = (await r.json()) as { tracks?: Track[] };
      if (data.tracks && data.tracks.length > 0) {
        setTracks(data.tracks);
      } else {
        setError("歌单为空");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [tracksLoaded, loading, setTracks]);

  const playAt = useCallback((idx: number) => {
    const track = tracks[idx];
    setCurrentIdx(idx);
    if (!track?.url) {
      setPlaying(false);
      setError("这首歌当前没有可播放音源");
      return;
    }
    setError(null);
    setPlaying(true);
  }, [tracks]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a || !current?.url) return;
    if (a.paused) {
      setError(null);
      a.play()
        .then(() => setPlaying(true))
        .catch(() => {
          setPlaying(false);
          setError("音频播放失败，请稍后重试");
        });
    } else {
      a.pause();
      setPlaying(false);
    }
  }, [current?.url]);

  const next = useCallback(() => {
    if (tracks.length === 0) return;
    setCurrentIdx((prev) => {
      if (shuffle) {
        const order = shuffleOrderRef.current;
        if (order.length === 0) return prev;
        const idx = shuffleCursorRef.current % order.length;
        shuffleCursorRef.current = idx + 1;
        return order[idx];
      }
      return nextPlayableIndex(tracks, prev, 1);
    });
    setPlaying(true);
  }, [tracks, shuffle]);

  const prev = useCallback(() => {
    if (tracks.length === 0) return;
    setCurrentIdx((p) => nextPlayableIndex(tracks, p, -1));
    setPlaying(true);
  }, [tracks]);

  const seek = useCallback((ms: number) => {
    const a = audioRef.current;
    if (!a || !Number.isFinite(ms)) return;
    const sec = Math.max(0, ms / 1000);
    a.currentTime = sec;
    setCurrentTime(sec * 1000);
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    if (clamped > 0 && muted) setMuted(false);
  }, [muted]);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(() => {
    setRepeatMode((m) => (m === "off" ? "all" : m === "all" ? "one" : "off"));
  }, []);

  // Load current track's audio source and play if needed
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!current?.url) {
      a.removeAttribute("src");
      a.load();
      setCurrentTime(0);
      setDuration(0);
      return;
    }
    if (a.src !== current.url) {
      a.src = current.url;
      a.load();
      setCurrentTime(0);
      setError(null);
    }
    if (playing) {
      a.play()
        .then(() => setPlaying(true))
        .catch(() => {
          setPlaying(false);
          setError("音频播放失败，请稍后重试");
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, current?.url]);

  // Toggle play/pause when `playing` state flips externally (e.g. via togglePlay)
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current?.url) return;
    if (playing && a.paused) {
      setError(null);
      a.play().catch(() => {
        setPlaying(false);
        setError("音频播放失败，请稍后重试");
      });
    } else if (!playing && !a.paused) {
      a.pause();
    }
  }, [playing, current?.url]);

  // Wire audio element events
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    // Throttle timeupdate to ~200 ms to avoid excessive re-renders.
    // CSS transitions on the progress bar smooth out the discrete jumps.
    const onTime = () => {
      const now = performance.now();
      if (now - lastTimeUpdateRef.current >= 200) {
        lastTimeUpdateRef.current = now;
        setCurrentTime(a.currentTime * 1000);
      }
    };
    const onMeta = () => setDuration((a.duration || 0) * 1000);
    const onPause = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    const onSeeked = () => setCurrentTime(a.currentTime * 1000);
    const onError = () => {
      setPlaying(false);
      setError("音频加载失败，请稍后重试");
    };
    const onCanPlay = () => setError(null);
    const onEnded = () => {
      if (repeatMode === "one") {
        a.currentTime = 0;
        a.play().catch(() => {
          /* noop */
        });
        return;
      }
      if (shuffle) {
        next();
        return;
      }
      const isLast = currentIdx >= tracks.length - 1;
      if (isLast && repeatMode === "off") {
        setPlaying(false);
        a.currentTime = 0;
        return;
      }
      next();
    };

    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("durationchange", onMeta);
    a.addEventListener("pause", onPause);
    a.addEventListener("play", onPlay);
    a.addEventListener("seeked", onSeeked);
    a.addEventListener("ended", onEnded);
    a.addEventListener("error", onError);
    a.addEventListener("canplay", onCanPlay);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("durationchange", onMeta);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("seeked", onSeeked);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("error", onError);
      a.removeEventListener("canplay", onCanPlay);
    };
  }, [repeatMode, shuffle, currentIdx, tracks.length, next]);

  // Media Session API
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!current) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      artwork: current.cover ? [{ src: current.cover, sizes: "300x300" }] : [],
    });
    navigator.mediaSession.setActionHandler("play", () => togglePlay());
    navigator.mediaSession.setActionHandler("pause", () => togglePlay());
    navigator.mediaSession.setActionHandler("nexttrack", () => next());
    navigator.mediaSession.setActionHandler("previoustrack", () => prev());
  }, [current, togglePlay, next, prev]);

  /* ─── Memoized context values ─── */

  const stateValue = useMemo<PlayerState>(
    () => ({
      tracks,
      currentIdx,
      volume,
      muted,
      repeatMode,
      shuffle,
      tracksLoaded,
      loading,
      error,
    }),
    [tracks, currentIdx, volume, muted, repeatMode, shuffle, tracksLoaded, loading, error],
  );

  const timeValue = useMemo<PlayerTime>(
    () => ({
      current,
      playing,
      currentTime,
      duration,
      seek,
      togglePlay,
      next,
      prev,
    }),
    [current, playing, currentTime, duration, seek, togglePlay, next, prev],
  );

  const actionsValue = useMemo<PlayerActions>(
    () => ({
      ensureTracksLoaded,
      setTracks,
      playAt,
      togglePlay,
      next,
      prev,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
    }),
    [ensureTracksLoaded, setTracks, playAt, togglePlay, next, prev, seek, setVolume, toggleMute, toggleShuffle, cycleRepeat],
  );

  const legacyValue = useMemo<PlayerContextValue>(
    () => ({
      ...stateValue,
      ...timeValue,
      ...actionsValue,
    }),
    [stateValue, timeValue, actionsValue],
  );

  return (
    <StateCtx.Provider value={stateValue}>
      <TimeCtx.Provider value={timeValue}>
        <ActionsCtx.Provider value={actionsValue}>
          <PlayerContext.Provider value={legacyValue}>
            {children}
          </PlayerContext.Provider>
        </ActionsCtx.Provider>
      </TimeCtx.Provider>
    </StateCtx.Provider>
  );
}

/* ─── Hooks ─── */

/** State that changes infrequently: tracks, settings, loading. */
export function useStateCtx(): PlayerState {
  const ctx = useContext(StateCtx);
  if (!ctx) throw new Error("useStateCtx must be used within PlayerProvider");
  return ctx;
}

/** Time-sensitive state that updates every ~200 ms while playing. */
export function useTimeCtx(): PlayerTime {
  const ctx = useContext(TimeCtx);
  if (!ctx) throw new Error("useTimeCtx must be used within PlayerProvider");
  return ctx;
}

/** Stable action callbacks — never triggers re-renders on their own. */
export function useActions(): PlayerActions {
  const ctx = useContext(ActionsCtx);
  if (!ctx) throw new Error("useActions must be used within PlayerProvider");
  return ctx;
}
