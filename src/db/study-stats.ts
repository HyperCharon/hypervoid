import "server-only";

import { gte, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { getStudySettings } from "@/db/study-settings";
import { addDays, dayKey, daysUntil, startOfDay } from "@/lib/study/dates";

export interface DashboardStats {
  examDate: Date | null;
  daysUntilExam: number | null;
  dueCards: number;
  newCards: number;
  totalCards: number;
  dueMistakes: number;
  totalMistakes: number;
  masteredMistakes: number;
  reviewsToday: number;
  todayStudyMinutes: number;
  streak: number;
  heatmap: { date: string; count: number }[];
}

const HEATMAP_DAYS = 119; // ~17 weeks, fits a 7-row grid

export async function getDashboardStats(
  now: Date = new Date(),
): Promise<DashboardStats> {
  const db = getDb();
  const settings = await getStudySettings();

  const [cardAgg] = await db
    .select({
      total: sql<number>`count(*)::int`,
      due: sql<number>`count(*) filter (where ${schema.studyCards.dueAt} <= ${now} and not ${schema.studyCards.suspended})::int`,
      fresh: sql<number>`count(*) filter (where ${schema.studyCards.state} = 'new')::int`,
    })
    .from(schema.studyCards);

  const [mistakeAgg] = await db
    .select({
      total: sql<number>`count(*)::int`,
      due: sql<number>`count(*) filter (where ${schema.studyMistakes.nextReviewAt} <= ${now} and not ${schema.studyMistakes.mastered})::int`,
      mastered: sql<number>`count(*) filter (where ${schema.studyMistakes.mastered})::int`,
    })
    .from(schema.studyMistakes);

  const [sessionAgg] = await db
    .select({
      seconds: sql<number>`coalesce(sum(${schema.studySessions.durationSec}), 0)::int`,
    })
    .from(schema.studySessions)
    .where(gte(schema.studySessions.startedAt, startOfDay(now)));

  const since = addDays(startOfDay(now), -HEATMAP_DAYS);
  const reviewRows = await db
    .select({ reviewedAt: schema.studyReviews.reviewedAt })
    .from(schema.studyReviews)
    .where(gte(schema.studyReviews.reviewedAt, since));

  const counts = new Map<string, number>();
  for (const r of reviewRows) {
    const k = dayKey(r.reviewedAt);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  const heatmap: { date: string; count: number }[] = [];
  for (let i = HEATMAP_DAYS; i >= 0; i--) {
    const k = dayKey(addDays(startOfDay(now), -i));
    heatmap.push({ date: k, count: counts.get(k) ?? 0 });
  }

  // Streak: consecutive days with ≥1 review ending today; today not counting
  // yet (0 reviews so far today) doesn't break a run carried from yesterday.
  let streak = 0;
  for (let i = 0; i <= HEATMAP_DAYS + 1; i++) {
    const k = dayKey(addDays(startOfDay(now), -i));
    const c = counts.get(k) ?? 0;
    if (c > 0) streak++;
    else if (i === 0) continue;
    else break;
  }

  return {
    examDate: settings.examDate ?? null,
    daysUntilExam: settings.examDate ? daysUntil(settings.examDate, now) : null,
    dueCards: cardAgg?.due ?? 0,
    newCards: cardAgg?.fresh ?? 0,
    totalCards: cardAgg?.total ?? 0,
    dueMistakes: mistakeAgg?.due ?? 0,
    totalMistakes: mistakeAgg?.total ?? 0,
    masteredMistakes: mistakeAgg?.mastered ?? 0,
    reviewsToday: counts.get(dayKey(now)) ?? 0,
    todayStudyMinutes: Math.round((sessionAgg?.seconds ?? 0) / 60),
    streak,
    heatmap,
  };
}
