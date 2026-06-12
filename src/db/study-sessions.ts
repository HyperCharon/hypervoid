import "server-only";

import { desc, eq, gte, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { addDays, dayKey, startOfDay } from "@/lib/study/dates";
import type { Subject } from "@/lib/study/subjects";

export type StudySession = typeof schema.studySessions.$inferSelect;

export async function createSession(input: {
  subject: Subject;
  durationSec: number;
  startedAt?: Date;
  endedAt?: Date;
  note?: string | null;
}): Promise<void> {
  const endedAt = input.endedAt ?? new Date();
  const startedAt =
    input.startedAt ?? new Date(endedAt.getTime() - input.durationSec * 1000);
  await getDb().insert(schema.studySessions).values({
    subject: input.subject,
    durationSec: input.durationSec,
    startedAt,
    endedAt,
    note: input.note ?? null,
  });
}

export async function listRecentSessions(limit = 20): Promise<StudySession[]> {
  return getDb()
    .select()
    .from(schema.studySessions)
    .orderBy(desc(schema.studySessions.startedAt))
    .limit(limit);
}

/** Seconds studied today, grouped by subject. */
export async function getTodayTotals(
  now: Date = new Date(),
): Promise<{ subject: Subject; seconds: number }[]> {
  const rows = await getDb()
    .select({
      subject: schema.studySessions.subject,
      seconds: sql<number>`sum(${schema.studySessions.durationSec})::int`,
    })
    .from(schema.studySessions)
    .where(gte(schema.studySessions.startedAt, startOfDay(now)))
    .groupBy(schema.studySessions.subject);
  return rows as { subject: Subject; seconds: number }[];
}

/** All-time total seconds per subject. */
export async function getSubjectTotals(): Promise<{ subject: Subject; seconds: number }[]> {
  const rows = await getDb()
    .select({
      subject: schema.studySessions.subject,
      seconds: sql<number>`sum(${schema.studySessions.durationSec})::int`,
    })
    .from(schema.studySessions)
    .groupBy(schema.studySessions.subject);
  return rows as { subject: Subject; seconds: number }[];
}

/** Aggregate study stats across all sessions. */
export async function getStudySummary(): Promise<{
  totalSessions: number;
  totalSeconds: number;
  avgSessionSec: number;
  longestSessionSec: number;
  activeDays: number;
}> {
  const [row] = await getDb()
    .select({
      totalSessions: sql<number>`count(*)::int`,
      totalSeconds: sql<number>`coalesce(sum(${schema.studySessions.durationSec}), 0)::int`,
      avgSessionSec: sql<number>`coalesce(avg(${schema.studySessions.durationSec}), 0)::int`,
      longestSessionSec: sql<number>`coalesce(max(${schema.studySessions.durationSec}), 0)::int`,
    })
    .from(schema.studySessions);

  // Count distinct days with at least one session
  const [dayRow] = await getDb()
    .select({
      activeDays: sql<number>`count(distinct date(${schema.studySessions.startedAt}))::int`,
    })
    .from(schema.studySessions);

  return {
    totalSessions: row?.totalSessions ?? 0,
    totalSeconds: row?.totalSeconds ?? 0,
    avgSessionSec: row?.avgSessionSec ?? 0,
    longestSessionSec: row?.longestSessionSec ?? 0,
    activeDays: dayRow?.activeDays ?? 0,
  };
}

/** Weekly per-subject totals (last 7 days). */
export async function getWeeklySubjectTotals(
  now: Date = new Date(),
): Promise<{ subject: Subject; seconds: number }[]> {
  const since = addDays(startOfDay(now), -6);
  const rows = await getDb()
    .select({
      subject: schema.studySessions.subject,
      seconds: sql<number>`sum(${schema.studySessions.durationSec})::int`,
    })
    .from(schema.studySessions)
    .where(gte(schema.studySessions.startedAt, since))
    .groupBy(schema.studySessions.subject);
  return rows as { subject: Subject; seconds: number }[];
}

/** Per-day total minutes for the last `days` days (oldest→newest, zero-filled). */
export async function getDailyTotals(
  days = 7,
  now: Date = new Date(),
): Promise<{ date: string; minutes: number }[]> {
  const since = addDays(startOfDay(now), -(days - 1));
  const rows = await getDb()
    .select({
      startedAt: schema.studySessions.startedAt,
      durationSec: schema.studySessions.durationSec,
    })
    .from(schema.studySessions)
    .where(gte(schema.studySessions.startedAt, since));

  const byDay = new Map<string, number>();
  for (const r of rows) {
    const k = dayKey(r.startedAt);
    byDay.set(k, (byDay.get(k) ?? 0) + r.durationSec);
  }

  const out: { date: string; minutes: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = dayKey(addDays(startOfDay(now), -i));
    out.push({ date: k, minutes: Math.round((byDay.get(k) ?? 0) / 60) });
  }
  return out;
}

export async function deleteSession(id: string): Promise<void> {
  await getDb().delete(schema.studySessions).where(eq(schema.studySessions.id, id));
}
