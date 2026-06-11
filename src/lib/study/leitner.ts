// Leitner 5-box review scheduling for the mistake notebook. Pure. A correct
// recall promotes the card a box (longer gap); a miss drops it back to box 1.
// Recalling again at the top box marks it mastered.

import { addDays, startOfDay } from "./dates";

export interface LeitnerState {
  box: number;
  reviewCount: number;
}

export interface LeitnerResult extends LeitnerState {
  nextReviewAt: Date;
  mastered: boolean;
}

/** Days until the next review for each box (indexed by box - 1). */
export const LEITNER_DAYS = [1, 2, 4, 7, 15] as const;
const MAX_BOX = LEITNER_DAYS.length; // 5

export function scheduleLeitner(
  current: LeitnerState,
  gotIt: boolean,
  now: Date = new Date(),
): LeitnerResult {
  const reviewCount = current.reviewCount + 1;

  if (!gotIt) {
    return {
      box: 1,
      reviewCount,
      nextReviewAt: addDays(startOfDay(now), LEITNER_DAYS[0]),
      mastered: false,
    };
  }

  const box = Math.min(MAX_BOX, current.box + 1);
  const mastered = current.box >= MAX_BOX; // already at the top and recalled again
  const intervalDays = LEITNER_DAYS[box - 1];
  return {
    box,
    reviewCount,
    nextReviewAt: addDays(startOfDay(now), intervalDays),
    mastered,
  };
}
