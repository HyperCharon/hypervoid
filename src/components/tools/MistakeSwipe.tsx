"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { Check, X } from "lucide-react";
import { reviewMistakeAction } from "@/app/tools/mistakes/actions";

type Mistake = {
  id: string;
  questionImage: string | null;
  questionText: string | null;
  myAnswer: string | null;
  correctAnswer: string | null;
  analysis: string | null;
};

const SWIPE_DISTANCE = 110;

export function MistakeSwipe({ mistakes, base }: { mistakes: Mistake[]; base: string }) {
  const total = mistakes.length;
  const [queue, setQueue] = useState<Mistake[]>(mistakes);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ got: 0, missed: 0 });
  const [, startTransition] = useTransition();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-5, 5]);
  const current = queue[0];

  function grade(gotIt: boolean) {
    const item = current;
    if (!item) return;
    startTransition(async () => {
      try { await reviewMistakeAction(item.id, gotIt); } catch { /* best-effort */ }
    });
    setStats((s) => ({
      got: s.got + (gotIt ? 1 : 0),
      missed: s.missed + (gotIt ? 0 : 1),
    }));
    setRevealed(false);
    x.set(0);
    setQueue((q) => (gotIt ? q.slice(1) : [...q.slice(1), item]));
  }

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!current) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (!revealed) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); setRevealed(true); }
        return;
      }
      switch (e.key) {
        case "ArrowRight": grade(true); break;
        case "ArrowLeft": grade(false); break;
        case "1": grade(false); break;
        case "2": grade(true); break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, revealed],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (!revealed) { x.set(0); return; }
    if (info.offset.x <= -SWIPE_DISTANCE) grade(false);
    else if (info.offset.x >= SWIPE_DISTANCE) grade(true);
    else x.set(0);
  }

  if (!current) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-16 text-center">
        <p className="text-lg font-medium">本轮复习完成</p>
        <p className="text-sm text-muted">
          掌握 {stats.got} · 未掌握 {stats.missed}
        </p>
        <div className="mt-2 flex gap-2">
          <Link
            href={`${base}/mistakes/review`}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            再来一轮
          </Link>
          <Link
            href={`${base}/mistakes`}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            返回
          </Link>
        </div>
      </div>
    );
  }

  const progress = total > 0 ? Math.round(((stats.got + stats.missed) / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>剩余 {queue.length}</span>
        <span className="text-accent">{stats.got} 掌握</span>
        <span>{stats.got + stats.missed}/{total}</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-background">
        <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <motion.div
        drag={revealed ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        style={{ x, rotate }}
        onDragEnd={onDragEnd}
        onClick={() => !revealed && setRevealed(true)}
        className="flex min-h-[14rem] select-none flex-col items-center justify-center rounded-2xl border border-border bg-card p-5 shadow-sm"
      >
        {current.questionImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.questionImage}
            alt="题目"
            className="max-h-48 w-full rounded-lg object-contain"
          />
        )}
        {current.questionText && (
          <p className="mt-2 whitespace-pre-wrap text-center text-base">{current.questionText}</p>
        )}

        {revealed && (
          <div className="mt-4 w-full border-t border-border pt-4 text-sm">
            {current.correctAnswer && (
              <p className="text-accent">
                <span className="text-muted">正确答案：</span>{current.correctAnswer}
              </p>
            )}
            {current.myAnswer && (
              <p className="mt-1 text-[var(--danger)]">
                <span className="text-muted">我的答案：</span>{current.myAnswer}
              </p>
            )}
            {current.analysis && (
              <p className="mt-2 whitespace-pre-wrap text-muted">{current.analysis}</p>
            )}
          </div>
        )}
      </motion.div>

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="rounded-xl border border-border bg-card py-3 text-sm font-medium hover:bg-card-hover"
        >
          看答案
        </button>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => grade(false)}
              className="flex items-center justify-center gap-2 rounded-xl border border-[var(--danger)]/40 py-3 text-sm font-medium text-[var(--danger)]"
            >
              <X className="h-4 w-4" aria-hidden /> 没掌握
            </button>
            <button
              type="button"
              onClick={() => grade(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-accent/40 py-3 text-sm font-medium text-accent"
            >
              <Check className="h-4 w-4" aria-hidden /> 掌握
            </button>
          </div>
          <p className="text-center text-xs text-muted">左滑「没掌握」· 右滑「掌握」· 快捷键 1 / 2</p>
        </>
      )}
    </div>
  );
}
