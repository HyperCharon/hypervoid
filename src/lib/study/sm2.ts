// SM-2 spaced repetition (Anki-flavoured). Pure + unit-testable: given a card's
// scheduling state and a review rating, return the next state. No I/O.

import { addDays, startOfDay } from "./dates";

export type Sm2Rating = 0 | 1 | 2 | 3; // again · hard · good · easy
export type Sm2State = "new" | "learning" | "review";

export interface Sm2CardState {
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
}

export interface Sm2Result extends Sm2CardState {
  state: Sm2State;
  dueAt: Date;
}

const MIN_EASE = 1.3;
const RELEARN_MINUTES = 10; // a lapsed card returns later the same session

export const RATING_LABELS: Record<Sm2Rating, string> = {
  0: "重来",
  1: "困难",
  2: "良好",
  3: "简单",
};

/**
 * Compute the next SM-2 schedule for a card given a review rating.
 * Ratings: 0 again · 1 hard · 2 good · 3 easy.
 */
export function scheduleSm2(
  card: Sm2CardState,
  rating: Sm2Rating,
  now: Date = new Date(),
): Sm2Result {
  // Lapse: reset the streak, bump lapses, soften ease, relearn in ~10 min.
  if (rating === 0) {
    return {
      ease: Math.max(MIN_EASE, card.ease - 0.2),
      intervalDays: 0,
      reps: 0,
      lapses: card.lapses + 1,
      state: "learning",
      dueAt: new Date(now.getTime() + RELEARN_MINUTES * 60_000),
    };
  }

  // Ease update with q' ∈ {3,4,5} for hard/good/easy (classic SM-2 curve).
  const q = rating === 1 ? 3 : rating === 2 ? 4 : 5;
  const ease = Math.max(
    MIN_EASE,
    card.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );
  const reps = card.reps + 1;

  let intervalDays: number;
  if (reps === 1) {
    intervalDays = rating === 3 ? 4 : 1; // easy graduates further
  } else if (reps === 2) {
    intervalDays = rating === 1 ? 4 : 6;
  } else {
    const mult = rating === 1 ? 0.8 : rating === 3 ? 1.3 : 1; // hard penalty / easy bonus
    intervalDays = Math.max(1, Math.round(card.intervalDays * ease * mult));
  }

  return {
    ease,
    intervalDays,
    reps,
    lapses: card.lapses,
    state: "review",
    dueAt: addDays(startOfDay(now), intervalDays),
  };
}
