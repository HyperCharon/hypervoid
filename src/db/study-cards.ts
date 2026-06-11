import "server-only";

import { and, asc, eq, lte } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { scheduleSm2, type Sm2Rating } from "@/lib/study/sm2";

export type StudyCard = typeof schema.studyCards.$inferSelect;

export async function listCards(deckId: string): Promise<StudyCard[]> {
  return getDb()
    .select()
    .from(schema.studyCards)
    .where(eq(schema.studyCards.deckId, deckId))
    .orderBy(asc(schema.studyCards.createdAt));
}

/** Cards due for review in a deck (oldest due first; new cards sort in too). */
export async function getDueCards(
  deckId: string,
  limit = 200,
  now: Date = new Date(),
): Promise<StudyCard[]> {
  return getDb()
    .select()
    .from(schema.studyCards)
    .where(
      and(
        eq(schema.studyCards.deckId, deckId),
        eq(schema.studyCards.suspended, false),
        lte(schema.studyCards.dueAt, now),
      ),
    )
    .orderBy(asc(schema.studyCards.dueAt))
    .limit(limit);
}

export type CardInput = {
  deckId: string;
  front: string;
  back: string;
  notes?: string | null;
};

export async function createCard(input: CardInput): Promise<StudyCard> {
  const rows = await getDb()
    .insert(schema.studyCards)
    .values({
      deckId: input.deckId,
      front: input.front,
      back: input.back,
      notes: input.notes ?? null,
    })
    .returning();
  return rows[0];
}

export async function deleteCard(id: string): Promise<void> {
  await getDb().delete(schema.studyCards).where(eq(schema.studyCards.id, id));
}

/** Apply a review rating: reschedule the card (SM-2) + append a review log row. */
export async function recordReview(
  cardId: string,
  rating: Sm2Rating,
  now: Date = new Date(),
): Promise<void> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.studyCards)
    .where(eq(schema.studyCards.id, cardId))
    .limit(1);
  const card = rows[0];
  if (!card) throw new Error("卡片不存在");

  const next = scheduleSm2(card, rating, now);
  await db
    .update(schema.studyCards)
    .set({
      ease: next.ease,
      intervalDays: next.intervalDays,
      reps: next.reps,
      lapses: next.lapses,
      state: next.state,
      dueAt: next.dueAt,
      lastReviewedAt: now,
    })
    .where(eq(schema.studyCards.id, cardId));

  await db.insert(schema.studyReviews).values({
    cardId,
    rating,
    prevIntervalDays: card.intervalDays,
    nextIntervalDays: next.intervalDays,
    reviewedAt: now,
  });
}

export type ImportCard = { front: string; back: string; notes?: string | null };

/** Bulk-insert cards (from CSV/JSON import). Returns the number created. */
export async function importCards(
  deckId: string,
  cards: ImportCard[],
): Promise<number> {
  if (cards.length === 0) return 0;
  const rows = await getDb()
    .insert(schema.studyCards)
    .values(
      cards.map((c) => ({
        deckId,
        front: c.front,
        back: c.back,
        notes: c.notes ?? null,
      })),
    )
    .returning({ id: schema.studyCards.id });
  return rows.length;
}
