"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  Coffee,
  Flame,
  Keyboard,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import { logSessionAction } from "@/app/tools/timer/actions";
import { SUBJECTS, SUBJECT_LABELS, type Subject } from "@/lib/study/subjects";

const WORK_DURATIONS = [25, 45, 60];
const BREAK_DURATIONS = [5, 10, 15];
const POMOS_BEFORE_LONG = 4;

const BREAK_MESSAGES = [
  "站起来走走，活动一下",
  "喝杯水，放松眼睛",
  "深呼吸，让大脑休息",
  "远眺窗外，保护视力",
  "伸展一下肩膀和脖子",
];

const WORK_MESSAGES = [
  "专注当下，不要分心",
  "每一步都算数",
  "你比想象中更强",
  "保持节奏，稳步前进",
];

/** Web Audio chime — gentle two-note bell. */
function playChime(): void {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    for (const [i, freq] of [523.25, 659.25].entries()) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.3);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.3 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.3 + 0.8);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.3);
      osc.stop(now + i * 0.3 + 0.8);
    }
    setTimeout(() => ctx.close(), 2000);
  } catch {
    // silent fallback
  }
}

function fmt(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const selectClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";

type Phase = "idle" | "work" | "transition" | "break";

export function PomodoroTimer({ todaySeconds = 0 }: { todaySeconds?: number }) {
  const router = useRouter();
  const [subject, setSubject] = useState<Subject>("english");
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pomoCount, setPomoCount] = useState(0);
  const [sessionNote, setSessionNote] = useState("");
  const [motivation, setMotivation] = useState(() => pick(WORK_MESSAGES));
  const startRef = useRef<number | null>(null);
  const baseRef = useRef(0);
  const finishingRef = useRef(false);

  const totalWorkSec = todaySeconds + Math.floor(elapsed);
  const isWork = phase === "work";
  const isBreak = phase === "break";
  const isTransition = phase === "transition";
  const isIdle = phase === "idle" && !running;

  // Duration for current phase
  const durationSec = isBreak
    ? (pomoCount > 0 && pomoCount % POMOS_BEFORE_LONG === 0 ? 15 * 60 : breakMin * 60)
    : workMin * 60;

  const remaining = Math.max(0, durationSec - elapsed);
  const pct = durationSec > 0 ? Math.min(100, (elapsed / durationSec) * 100) : 0;

  // Tick
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const seg = startRef.current ? (Date.now() - startRef.current) / 1000 : 0;
      setElapsed(baseRef.current + seg);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running]);

  const finishWork = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    const seconds = Math.min(Math.round(elapsed), workMin * 60);
    setRunning(false);
    startRef.current = null;
    playChime();

    if (seconds >= 30) {
      setSaving(true);
      try {
        await logSessionAction(subject, seconds, sessionNote || undefined);
        router.refresh();
      } catch { /* best-effort */ }
      setSaving(false);
    }

    const newCount = pomoCount + 1;
    setPomoCount(newCount);
    baseRef.current = 0;
    setElapsed(0);
    setSessionNote("");
    finishingRef.current = false;

    // Show transition screen instead of auto-starting break
    setPhase("transition");
    setMotivation(pick(BREAK_MESSAGES));
  }, [elapsed, workMin, subject, router, pomoCount, sessionNote]);

  const finishBreak = useCallback(() => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setRunning(false);
    startRef.current = null;
    playChime();
    baseRef.current = 0;
    setElapsed(0);
    setPhase("idle");
    setMotivation(pick(WORK_MESSAGES));
    finishingRef.current = false;
  }, []);

  // Auto-finish when countdown reaches zero
  useEffect(() => {
    if (running && elapsed >= durationSec) {
      if (isWork) void finishWork();
      else if (isBreak) finishBreak();
    }
  }, [elapsed, running, durationSec, isWork, isBreak, finishWork, finishBreak]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          if (isTransition) startBreak();
          else if (running) pause();
          else start();
          break;
        case "r":
        case "R":
          if (!running && !isIdle) reset();
          break;
        case "f":
        case "F":
          if (isWork && elapsed > 0) void finishWork();
          else if (isBreak) finishBreak();
          break;
        case "s":
        case "S":
          if (isTransition) skipBreakAndIdle();
          break;
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isTransition, running, isIdle, isWork, isBreak, elapsed, startBreak, pause, start, reset, finishWork, finishBreak, skipBreakAndIdle]);

  function start() {
    if (phase === "idle") setPhase("work");
    startRef.current = Date.now();
    setRunning(true);
  }
  function pause() {
    baseRef.current = elapsed;
    startRef.current = null;
    setRunning(false);
  }
  function reset() {
    baseRef.current = 0;
    startRef.current = null;
    setElapsed(0);
    setRunning(false);
    setPhase("idle");
  }
  function startBreak() {
    setPhase("break");
    startRef.current = Date.now();
    setRunning(true);
  }
  function skipBreakAndIdle() {
    setPhase("idle");
    setElapsed(0);
    baseRef.current = 0;
  }

  const isLongBreak = pomoCount > 0 && pomoCount % POMOS_BEFORE_LONG === 0;
  const pomoInCycle = pomoCount % POMOS_BEFORE_LONG;
  const pomosUntilLong = POMOS_BEFORE_LONG - pomoInCycle;

  return (
    <div className={`flex flex-col gap-4 rounded-2xl border bg-card p-5 transition-colors ${
      isBreak ? "border-accent/30" : isWork ? "border-accent/10" : "border-border"
    }`}>
      {/* Phase + subject header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isBreak && <Coffee className="h-4 w-4 text-accent" aria-hidden />}
          <span className="text-sm font-medium">
            {isIdle && "准备开始"}
            {isWork && "专注中"}
            {isTransition && "专注完成"}
            {isBreak && (isLongBreak ? "长休息" : "短休息")}
          </span>
        </div>
        {(isIdle || isBreak) && (
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as Subject)}
            className="rounded border border-border bg-transparent px-2 py-1 text-xs text-muted"
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{SUBJECT_LABELS[s]}</option>
            ))}
          </select>
        )}
        {isWork && (
          <span className="text-xs text-muted">{SUBJECT_LABELS[subject]}</span>
        )}
      </div>

      {/* Transition screen: work finished → choose next action */}
      <AnimatePresence mode="wait">
        {isTransition ? (
          <motion.div
            key="transition"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex flex-col items-center gap-4 py-6"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
              <Check className="h-8 w-8 text-accent" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">专注完成</p>
              <p className="mt-1 text-sm text-muted">{workMin} 分钟已记录</p>
            </div>
            <p className="text-sm text-muted italic">"{motivation}"</p>

            {/* Session note */}
            <input
              type="text"
              value={sessionNote}
              onChange={(e) => setSessionNote(e.target.value)}
              placeholder="备注（可选，回车跳过）"
              className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-center text-sm text-foreground"
            />

            <div className="flex flex-col gap-2 w-full max-w-xs">
              <button
                type="button"
                onClick={startBreak}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground"
              >
                <Coffee className="h-4 w-4" /> 开始{isLongBreak ? "长" : "短"}休息（{isLongBreak ? 15 : breakMin} 分钟）
              </button>
              <button
                type="button"
                onClick={() => { setPhase("work"); setElapsed(0); baseRef.current = 0; start(); }}
                className="flex items-center justify-center gap-2 rounded-xl border border-accent/40 py-2.5 text-sm text-accent"
              >
                <Flame className="h-4 w-4" /> 继续学习（{subjectLabel(subject)}）
              </button>
              <button
                type="button"
                onClick={skipBreakAndIdle}
                className="text-xs text-muted hover:text-foreground"
              >
                结束本轮
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="timer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Ring timer */}
            <div className="relative mx-auto w-48 h-48">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle
                  cx="60" cy="60" r="54"
                  fill="none" stroke="currentColor"
                  className="text-border" strokeWidth="6"
                />
                <circle
                  cx="60" cy="60" r="54"
                  fill="none" stroke="currentColor"
                  className={isBreak ? "text-accent/50" : "text-accent"}
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 * (1 - pct / 100)}
                  style={{ transition: "stroke-dashoffset 0.3s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className={`font-display text-4xl font-bold tabular-nums tracking-tight ${isBreak ? "text-accent" : ""}`}>
                  {fmt(remaining)}
                </p>
                {!isIdle && (
                  <p className="mt-0.5 text-xs text-muted">
                    {isWork ? `${pomoInCycle + 1} / ${POMOS_BEFORE_LONG}` : "休息中"}
                  </p>
                )}
              </div>
            </div>

            {/* Cycle progress: 4 dots showing pomodoros in current cycle */}
            {!isIdle && (
              <div className="flex items-center justify-center gap-3 mt-2">
                {Array.from({ length: POMOS_BEFORE_LONG }).map((_, i) => {
                  const filled = i < pomoInCycle || (isWork && i === pomoInCycle);
                  const active = isWork && i === pomoInCycle;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className={`h-2.5 w-2.5 rounded-full transition-all ${
                        active ? "bg-accent scale-125 ring-2 ring-accent/30" :
                        filled ? "bg-accent" : "bg-border"
                      }`} />
                    </div>
                  );
                })}
                {pomoInCycle === 0 && pomoCount > 0 && (
                  <Check className="h-3.5 w-3.5 text-accent" />
                )}
              </div>
            )}

            {/* Motivational hint during work */}
            {isWork && (
              <p className="mt-2 text-center text-xs text-muted italic">"{motivation}"</p>
            )}

            {/* Duration selectors (idle only) */}
            {isIdle && (
              <div className="mt-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">专注</span>
                  <div className="flex gap-1">
                    {WORK_DURATIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setWorkMin(d)}
                        className={`rounded-lg px-3 py-1.5 text-xs ${
                          workMin === d ? "bg-accent text-primary-foreground" : "border border-border text-muted"
                        }`}
                      >
                        {d}′
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">休息</span>
                  <div className="flex gap-1">
                    {BREAK_DURATIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setBreakMin(d)}
                        className={`rounded-lg px-3 py-1.5 text-xs ${
                          breakMin === d ? "bg-accent text-primary-foreground" : "border border-border text-muted"
                        }`}
                      >
                        {d}′
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control buttons */}
      {!isTransition && (
        <div className="flex justify-center gap-2">
          {!running ? (
            <button
              type="button"
              onClick={start}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
            >
              <Play className="h-4 w-4" />
              {isIdle ? "开始专注" : isBreak ? "继续休息" : "继续"}
            </button>
          ) : (
            <button
              type="button"
              onClick={pause}
              className="flex items-center gap-2 rounded-xl border border-border px-6 py-2.5 text-sm font-medium"
            >
              <Pause className="h-4 w-4" />
              暂停
            </button>
          )}
          {isWork && (
            <button
              type="button"
              onClick={() => void finishWork()}
              disabled={elapsed === 0 || saving}
              className="flex items-center gap-2 rounded-xl border border-accent/40 px-4 py-2.5 text-sm text-accent disabled:opacity-50"
            >
              <Check className="h-4 w-4" /> 结束
            </button>
          )}
          {isBreak && (
            <button
              type="button"
              onClick={finishBreak}
              className="flex items-center gap-2 rounded-xl border border-accent/40 px-4 py-2.5 text-sm text-accent"
            >
              <SkipForward className="h-4 w-4" /> 跳过
            </button>
          )}
          {!isIdle && (
            <button
              type="button"
              onClick={reset}
              aria-label="重置"
              className="rounded-xl border border-border px-3 py-2.5 text-muted"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Pomo cycle dots (full history) */}
      {pomoCount > 0 && !isTransition && (
        <div className="flex justify-center gap-1">
          {Array.from({ length: Math.min(pomoCount, 12) }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                (i + 1) % POMOS_BEFORE_LONG === 0 ? "bg-accent" : "bg-accent/30"
              }`}
            />
          ))}
          {pomoCount > 12 && <span className="ml-1 text-[10px] text-muted">+{pomoCount - 12}</span>}
        </div>
      )}

      {/* Today summary (idle only) */}
      {isIdle && todaySeconds > 0 && (
        <div className="rounded-xl border border-border bg-background/50 px-4 py-3 text-center">
          <p className="text-xs text-muted">今日已专注</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">
            {Math.floor(todaySeconds / 60)} 分钟
          </p>
        </div>
      )}

      {/* Keyboard hints */}
      {isIdle && (
        <div className="flex items-center justify-center gap-3 text-[10px] text-muted-soft">
          <span><Keyboard className="inline h-3 w-3 mr-0.5" />Space 开始</span>
          <span>R 重置</span>
          <span>F 结束</span>
        </div>
      )}
    </div>
  );
}

function subjectLabel(s: Subject): string {
  return SUBJECT_LABELS[s] ?? s;
}
