"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pause, Play, RotateCcw } from "lucide-react";
import { logSessionAction } from "@/app/tools/timer/actions";
import { SUBJECTS, SUBJECT_LABELS, type Subject } from "@/lib/study/subjects";

const DURATIONS = [25, 45, 60]; // minutes

function fmt(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const selectClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";

export function PomodoroTimer() {
  const router = useRouter();
  const [subject, setSubject] = useState<Subject>("english");
  const [durationMin, setDurationMin] = useState(25);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const startRef = useRef<number | null>(null);
  const baseRef = useRef(0);
  const finishingRef = useRef(false);
  const durationSec = durationMin * 60;

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

  const finish = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    const seconds = Math.min(Math.round(elapsed), durationSec);
    setRunning(false);
    startRef.current = null;
    if (seconds >= 30) {
      setSaving(true);
      try {
        await logSessionAction(subject, seconds);
        router.refresh();
      } catch {
        // best-effort
      }
      setSaving(false);
    }
    baseRef.current = 0;
    setElapsed(0);
    finishingRef.current = false;
  }, [elapsed, durationSec, subject, router]);

  // auto-finish when the countdown reaches zero
  useEffect(() => {
    if (running && elapsed >= durationSec) void finish();
  }, [elapsed, running, durationSec, finish]);

  function start() {
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
  }

  const remaining = Math.max(0, durationSec - elapsed);
  const idle = elapsed === 0 && !running;
  const pct = Math.min(100, (elapsed / durationSec) * 100);

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <select
          value={subject}
          disabled={!idle}
          onChange={(e) => setSubject(e.target.value as Subject)}
          className={`${selectClass} disabled:opacity-60`}
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {SUBJECT_LABELS[s]}
            </option>
          ))}
        </select>
        <div className="flex gap-1">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              disabled={!idle}
              onClick={() => setDurationMin(d)}
              className={`rounded-lg px-3 py-2 text-sm disabled:opacity-60 ${
                durationMin === d
                  ? "bg-accent text-primary-foreground"
                  : "border border-border text-muted"
              }`}
            >
              {d}′
            </button>
          ))}
        </div>
      </div>

      <div className="text-center">
        <p className="font-display text-6xl font-bold tabular-nums">
          {fmt(remaining)}
        </p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-background">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex justify-center gap-2">
        {!running ? (
          <button
            type="button"
            onClick={start}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <Play className="h-4 w-4" aria-hidden />
            {elapsed > 0 ? "继续" : "开始"}
          </button>
        ) : (
          <button
            type="button"
            onClick={pause}
            className="flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium"
          >
            <Pause className="h-4 w-4" aria-hidden />
            暂停
          </button>
        )}
        <button
          type="button"
          onClick={finish}
          disabled={elapsed === 0 || saving}
          className="flex items-center gap-2 rounded-lg border border-accent/40 px-4 py-2.5 text-sm font-medium text-accent disabled:opacity-50"
        >
          <Check className="h-4 w-4" aria-hidden />
          结束并记录
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={elapsed === 0}
          aria-label="重置"
          className="rounded-lg border border-border px-3 py-2.5 text-muted disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
