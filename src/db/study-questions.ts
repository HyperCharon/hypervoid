import "server-only";

import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import type { Subject } from "@/lib/study/subjects";

export type StudyQuestion = typeof schema.studyQuestions.$inferSelect;

export async function getRandomQuestions(opts: {
  subject?: Subject;
  limit?: number;
}): Promise<StudyQuestion[]> {
  const where = opts.subject
    ? eq(schema.studyQuestions.subject, opts.subject)
    : undefined;
  return getDb()
    .select()
    .from(schema.studyQuestions)
    .where(where)
    .orderBy(sql`random()`)
    .limit(opts.limit ?? 10);
}

export async function countQuestionsBySubject(): Promise<
  { subject: Subject; count: number }[]
> {
  const rows = await getDb()
    .select({
      subject: schema.studyQuestions.subject,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.studyQuestions)
    .groupBy(schema.studyQuestions.subject);
  return rows as { subject: Subject; count: number }[];
}

export async function getQuizStats(): Promise<{
  totalQuestions: number;
  attempts: number;
  correct: number;
}> {
  const db = getDb();
  const [q] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.studyQuestions);
  const [a] = await db
    .select({
      total: sql<number>`count(*)::int`,
      correct: sql<number>`count(*) filter (where ${schema.studyAttempts.correct})::int`,
    })
    .from(schema.studyAttempts);
  return {
    totalQuestions: q?.c ?? 0,
    attempts: a?.total ?? 0,
    correct: a?.correct ?? 0,
  };
}

export type QuestionInput = {
  subject: Subject;
  stem: string;
  options: string[];
  answer: number;
  answerMask: number | null;
  explanation?: string | null;
  tags?: string[];
};

function toRow(i: QuestionInput) {
  return {
    subject: i.subject,
    stem: i.stem,
    options: i.options,
    answer: i.answer,
    answerMask: i.answerMask,
    explanation: i.explanation ?? null,
    tags: i.tags ?? [],
  };
}

export async function createQuestion(input: QuestionInput): Promise<void> {
  await getDb().insert(schema.studyQuestions).values(toRow(input));
}

export async function importQuestions(items: QuestionInput[]): Promise<number> {
  if (items.length === 0) return 0;
  const rows = await getDb()
    .insert(schema.studyQuestions)
    .values(items.map(toRow))
    .returning({ id: schema.studyQuestions.id });
  return rows.length;
}

export async function deleteQuestion(id: string): Promise<void> {
  await getDb()
    .delete(schema.studyQuestions)
    .where(eq(schema.studyQuestions.id, id));
}

export async function recordAttempt(input: {
  questionId: string;
  chosen: number;
  chosenMask: number | null;
  correct: boolean;
}): Promise<void> {
  await getDb().insert(schema.studyAttempts).values({
    questionId: input.questionId,
    chosen: input.chosen,
    chosenMask: input.chosenMask,
    correct: input.correct,
  });
}
