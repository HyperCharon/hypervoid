"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
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
  const [queue, setQueue] = useState<Card[]>(cards);
  const [flipped, setFlipped] = useState(false);
  const [graded, setGraded] = useState(0);
  const [, startTransition] = useTransition();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-9, 9]);
  const current = queue[0];

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
        <Link
          href={`${base}/flashcards`}
          className="mt-2 rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
        >
          返回牌组
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>剩余 {queue.length}</span>
        <span>已复习 {graded}</span>
      </div>

      <motion.div
        drag={flipped ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        style={{ x, rotate }}
        onDragEnd={onDragEnd}
        onClick={() => !flipped && setFlipped(true)}
        className="flex min-h-[16rem] select-none flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <p className="text-center text-3xl font-semibold">{current.front}</p>
        {flipped && (
          <div className="mt-5 w-full border-t border-border pt-5">
            <p className="whitespace-pre-wrap text-center text-lg">{current.back}</p>
            {current.notes && (
              <p className="mt-3 whitespace-pre-wrap text-center text-sm text-muted">
                {current.notes}
              </p>
            )}
          </div>
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
          <p className="text-center text-xs text-muted">左滑「重来」· 右滑「良好」</p>
        </>
      )}
    </div>
  );
}
