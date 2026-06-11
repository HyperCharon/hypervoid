import "server-only";

import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import type { Subject } from "@/lib/study/subjects";

export type StudySettings = typeof schema.studySettings.$inferSelect;

/** Reads the single settings row (id=1), lazily creating it on first access. */
export async function getStudySettings(): Promise<StudySettings> {
  const db = getDb();
  const existing = await db
    .select()
    .from(schema.studySettings)
    .where(eq(schema.studySettings.id, 1))
    .limit(1);
  if (existing[0]) return existing[0];

  await db.insert(schema.studySettings).values({ id: 1 }).onConflictDoNothing();
  const rows = await db
    .select()
    .from(schema.studySettings)
    .where(eq(schema.studySettings.id, 1))
    .limit(1);
  return rows[0];
}

export type StudySettingsInput = {
  examDate?: Date | null;
  dailyNewCards?: number;
  dailyReviewCap?: number;
  dailyMinuteGoals?: Partial<Record<Subject, number>>;
};

export async function updateStudySettings(input: StudySettingsInput): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (input.examDate !== undefined) patch.examDate = input.examDate;
  if (input.dailyNewCards !== undefined) patch.dailyNewCards = input.dailyNewCards;
  if (input.dailyReviewCap !== undefined) patch.dailyReviewCap = input.dailyReviewCap;
  if (input.dailyMinuteGoals !== undefined)
    patch.dailyMinuteGoals = input.dailyMinuteGoals;

  await getDb()
    .insert(schema.studySettings)
    .values({ id: 1, ...patch })
    .onConflictDoUpdate({
      target: schema.studySettings.id,
      set: { ...patch, updatedAt: new Date() },
    });
}
