import "server-only";

import { desc, gte, sql } from "drizzle-orm";
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
