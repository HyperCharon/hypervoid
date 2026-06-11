import "server-only";

import { and, asc, desc, eq, lte } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { scheduleLeitner } from "@/lib/study/leitner";
import type { Subject } from "@/lib/study/subjects";

export type StudyMistake = typeof schema.studyMistakes.$inferSelect;

export async function listMistakes(filter?: {
  subject?: Subject;
}): Promise<StudyMistake[]> {
  const where = filter?.subject
    ? eq(schema.studyMistakes.subject, filter.subject)
    : undefined;
  return getDb()
    .select()
    .from(schema.studyMistakes)
    .where(where)
    .orderBy(desc(schema.studyMistakes.createdAt));
}

/** Mistakes due for review (not yet mastered), soonest first. */
export async function getDueMistakes(
  limit = 200,
  now: Date = new Date(),
): Promise<StudyMistake[]> {
  return getDb()
    .select()
    .from(schema.studyMistakes)
    .where(
      and(
        eq(schema.studyMistakes.mastered, false),
        lte(schema.studyMistakes.nextReviewAt, now),
      ),
    )
    .orderBy(asc(schema.studyMistakes.nextReviewAt))
    .limit(limit);
}

export async function getMistake(id: string): Promise<StudyMistake | null> {
  const rows = await getDb()
    .select()
    .from(schema.studyMistakes)
    .where(eq(schema.studyMistakes.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export type MistakeInput = {
  subject: Subject;
  topic?: string | null;
  tags?: string[];
  questionImage?: string | null;
  questionText?: string | null;
  myAnswer?: string | null;
  correctAnswer?: string | null;
  analysis?: string | null;
};

export async function createMistake(input: MistakeInput): Promise<StudyMistake> {
  const rows = await getDb()
    .insert(schema.studyMistakes)
    .values({
      subject: input.subject,
      topic: input.topic ?? null,
      tags: input.tags ?? [],
      questionImage: input.questionImage ?? null,
      questionText: input.questionText ?? null,
      myAnswer: input.myAnswer ?? null,
      correctAnswer: input.correctAnswer ?? null,
      analysis: input.analysis ?? null,
    })
    .returning();
  return rows[0];
}

export async function updateMistake(
  id: string,
  input: MistakeInput,
): Promise<void> {
  await getDb()
    .update(schema.studyMistakes)
    .set({
      subject: input.subject,
      topic: input.topic ?? null,
      tags: input.tags ?? [],
      questionImage: input.questionImage ?? null,
      questionText: input.questionText ?? null,
      myAnswer: input.myAnswer ?? null,
      correctAnswer: input.correctAnswer ?? null,
      analysis: input.analysis ?? null,
      updatedAt: new Date(),
    })
    .where(eq(schema.studyMistakes.id, id));
}

export async function deleteMistake(id: string): Promise<void> {
  await getDb().delete(schema.studyMistakes).where(eq(schema.studyMistakes.id, id));
}

/** Apply a Leitner review outcome (got it / missed it) to a mistake. */
export async function recordMistakeReview(
  id: string,
  gotIt: boolean,
  now: Date = new Date(),
): Promise<void> {
  const mistake = await getMistake(id);
  if (!mistake) throw new Error("错题不存在");
  const next = scheduleLeitner(
    { box: mistake.box, reviewCount: mistake.reviewCount },
    gotIt,
    now,
  );
  await getDb()
    .update(schema.studyMistakes)
    .set({
      box: next.box,
      reviewCount: next.reviewCount,
      nextReviewAt: next.nextReviewAt,
      mastered: next.mastered,
      updatedAt: now,
    })
    .where(eq(schema.studyMistakes.id, id));
}
