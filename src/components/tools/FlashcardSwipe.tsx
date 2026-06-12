"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { motion, useMotionValue, useTransform, useAnimation, type PanInfo } from "motion/react";
import { reviewCardAction } from "@/app/tools/flashcards/actions";
import type { Sm2Rating } from "@/lib/study/sm2";

type Card = { id: string; front: string; back: string; notes: string | null };

const SWIPE_DISTANCE = 110;

const RATINGS: { rating: Sm2Rating; label: string; className: string }[] = [
  { rating: 0, label: "重来", className: "border-[var(--danger)]/40 text-[var(--danger)]" },
  { rating: 1, label: "困难", className: "border-border text-muted" },
  { rating: 2, label: "良好", className: "border-accent/40 text-accent" },
  { rating: 3, label: "简单", className: "border-accent/40 text-accent-soft" },
];

export function FlashcardSwipe({ cards, base }: { cards: Card[]; base: string }) {
  const total = cards.length;
  const [queue, setQueue] = useState<Card[]>(cards);
  const [flipped, setFlipped] = useState(false);
  const [graded, setGraded] = useState(0);
  const [, startTransition] = useTransition();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-9, 9]);
  const current = queue[0];

  // Keyboard shortcuts: Space=flip, 1-4=rate, ←=again, →=good
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!current) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (!flipped) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setFlipped(true);
        }
        return;
      }

      switch (e.key) {
        case "1": rate(0); break;
        case "2": rate(1); break;
        case "3": rate(2); break;
        case "4": rate(3); break;
        case "ArrowLeft": rate(0); break;
        case "ArrowRight": rate(2); break;
        case " ":
        case "Enter":
          e.preventDefault();
          rate(2); // default to "Good" on Space when flipped
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, flipped],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  function rate(rating: Sm2Rating) {
    const card = current;
    if (!card) return;
    startTransition(async () => {
      try {
        await reviewCardAction(card.id, rating);
      } catch {
        // best-effort; a failed write just won't reschedule this card
      }
    });
    setGraded((g) => g + 1);
    setFlipped(false);
    x.set(0);
    // "again" cards return to the back of this session's queue.
    setQueue((q) => (rating === 0 ? [...q.slice(1), card] : q.slice(1)));
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    if (!flipped) {
      x.set(0);
      return;
    }
    if (info.offset.x <= -SWIPE_DISTANCE) rate(0);
    else if (info.offset.x >= SWIPE_DISTANCE) rate(2);
    else x.set(0);
  }

  if (!current) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-16 text-center">
        <p className="text-lg font-medium">本轮复习完成</p>
        <p className="text-sm text-muted">共复习 {graded} 张</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => { setQueue(cards); setGraded(0); setFlipped(false); }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            再来一轮
          </button>
          <Link
            href={`${base}/flashcards`}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            返回
          </Link>
        </div>
      </div>
    );
  }

  const progress = total > 0 ? Math.round((graded / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>剩余 {queue.length}</span>
        <span>已复习 {graded}/{total}</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-background">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <motion.div
        drag={flipped ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        style={{ x, rotate }}
        onDragEnd={onDragEnd}
        onClick={() => !flipped && setFlipped(true)}
        className="relative flex min-h-[16rem] select-none flex-col items-center justify-center rounded-2xl border border-border bg-card p-6"
        initial={false}
        animate={{ boxShadow: flipped ? "0 8px 32px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.06)" }}
        transition={{ duration: 0.2 }}
      >
        {/* Swipe direction overlays */}
        {flipped && (
          <>
            <motion.div
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 rounded-lg bg-[var(--danger)]/10 px-3 py-1.5 text-sm font-medium text-[var(--danger)] opacity-0"
              style={{ opacity: useTransform(x, [-120, -40], [0.9, 0]) }}
            >
              重来
            </motion.div>
            <motion.div
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent opacity-0"
              style={{ opacity: useTransform(x, [40, 120], [0, 0.9]) }}
            >
              良好
            </motion.div>
          </>
        )}

        <p className="text-center text-3xl font-semibold">{current.front}</p>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-5 w-full border-t border-border pt-5"
          >
            <p className="whitespace-pre-wrap text-center text-lg">{current.back}</p>
            {current.notes && (
              <p className="mt-3 whitespace-pre-wrap text-center text-sm text-muted">
                {current.notes}
              </p>
            )}
          </motion.div>
        )}
      </motion.div>

      {!flipped ? (
        <button
          type="button"
          onClick={() => setFlipped(true)}
          className="rounded-xl border border-border bg-card py-3 text-sm font-medium hover:bg-card-hover"
        >
          显示答案
        </button>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2">
            {RATINGS.map((r) => (
              <button
                key={r.rating}
                type="button"
                onClick={() => rate(r.rating)}
                className={`rounded-xl border bg-card py-3 text-sm font-medium hover:bg-card-hover ${r.className}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-muted">左滑「重来」· 右滑「良好」· 快捷键 1-4</p>
        </>
      )}
    </div>
  );
}
