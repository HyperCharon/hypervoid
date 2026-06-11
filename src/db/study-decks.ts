import "server-only";

import { asc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import type { Subject } from "@/lib/study/subjects";

export type StudyDeck = typeof schema.studyDecks.$inferSelect;
export type DeckWithCounts = StudyDeck & { total: number; due: number };

export async function listDecks(): Promise<StudyDeck[]> {
  return getDb()
    .select()
    .from(schema.studyDecks)
    .orderBy(asc(schema.studyDecks.sortOrder), asc(schema.studyDecks.createdAt));
}

/** Decks with their card totals + how many are due now (for the deck list). */
export async function listDecksWithCounts(
  now: Date = new Date(),
): Promise<DeckWithCounts[]> {
  const decks = await listDecks();
  if (decks.length === 0) return [];

  const counts = await getDb()
    .select({
      deckId: schema.studyCards.deckId,
      total: sql<number>`count(*)::int`,
      due: sql<number>`count(*) filter (where ${schema.studyCards.dueAt} <= ${now} and not ${schema.studyCards.suspended})::int`,
    })
    .from(schema.studyCards)
    .groupBy(schema.studyCards.deckId);

  const byId = new Map(counts.map((c) => [c.deckId, c]));
  return decks.map((d) => ({
    ...d,
    total: byId.get(d.id)?.total ?? 0,
    due: byId.get(d.id)?.due ?? 0,
  }));
}

export async function getDeck(id: string): Promise<StudyDeck | null> {
  const rows = await getDb()
    .select()
    .from(schema.studyDecks)
    .where(eq(schema.studyDecks.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export type DeckInput = {
  name: string;
  subject?: Subject;
  description?: string | null;
  sortOrder?: number;
};

export async function createDeck(input: DeckInput): Promise<StudyDeck> {
  const rows = await getDb()
    .insert(schema.studyDecks)
    .values({
      name: input.name,
      subject: input.subject ?? "english",
      description: input.description ?? null,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
  return rows[0];
}

export async function updateDeck(id: string, input: DeckInput): Promise<void> {
  await getDb()
    .update(schema.studyDecks)
    .set({
      name: input.name,
      subject: input.subject ?? "english",
      description: input.description ?? null,
      sortOrder: input.sortOrder ?? 0,
      updatedAt: new Date(),
    })
    .where(eq(schema.studyDecks.id, id));
}

export async function deleteDeck(id: string): Promise<void> {
  await getDb().delete(schema.studyDecks).where(eq(schema.studyDecks.id, id));
}
