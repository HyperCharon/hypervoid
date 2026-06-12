import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import {
  REACTION_KEYS,
  emptyReactionCounts,
  type ReactionCounts,
  type ReactionKey,
} from "@/lib/reactions-shared";

export {
  REACTION_EMOJIS,
  REACTION_KEYS,
  emptyReactionCounts,
} from "@/lib/reactions-shared";
export type { ReactionKey, ReactionCounts } from "@/lib/reactions-shared";

function isValidEmoji(emoji: string): emoji is ReactionKey {
  return (REACTION_KEYS as readonly string[]).includes(emoji);
}

function isConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** Fetch all 5 emoji counts for a post — missing emojis default to 0. */
export async function getReactionCounts(
  slug: string,
): Promise<ReactionCounts | null> {
  if (!isConfigured()) return null;
  try {
    const rows = await getDb()
      .select({
        emoji: schema.postReactions.emoji,
        count: schema.postReactions.count,
      })
      .from(schema.postReactions)
      .where(eq(schema.postReactions.slug, slug));
    const counts = emptyReactionCounts();
    for (const r of rows) {
      if (isValidEmoji(r.emoji)) counts[r.emoji] = r.count;
    }
    return counts;
  } catch (e) {
    console.warn("[reactions]", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function incrementReaction(
  slug: string,
  emoji: string,
): Promise<number | null> {
  if (!isConfigured()) return null;
  if (!isValidEmoji(emoji)) return null;
  try {
    const rows = await getDb()
      .insert(schema.postReactions)
      .values({ slug, emoji, count: 1 })
      .onConflictDoUpdate({
        target: [schema.postReactions.slug, schema.postReactions.emoji],
        set: {
          count: sql`${schema.postReactions.count} + 1`,
          updatedAt: new Date(),
        },
      })
      .returning({ count: schema.postReactions.count });
    return rows[0]?.count ?? null;
  } catch (e) {
    console.warn("[reactions]", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function decrementReaction(
  slug: string,
  emoji: string,
): Promise<number | null> {
  if (!isConfigured()) return null;
  if (!isValidEmoji(emoji)) return null;
  try {
    const rows = await getDb()
      .update(schema.postReactions)
      .set({
        count: sql`GREATEST(${schema.postReactions.count} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.postReactions.slug, slug),
          eq(schema.postReactions.emoji, emoji),
        ),
      )
      .returning({ count: schema.postReactions.count });
    return rows[0]?.count ?? 0;
  } catch (e) {
    console.warn("[reactions]", e instanceof Error ? e.message : e);
    return null;
  }
}

/** Sum of all reactions across all emojis — for site-wide engagement stats. */
export async function getTotalReactionCount(): Promise<number> {
  if (!isConfigured()) return 0;
  try {
    const rows = await getDb()
      .select({
        total: sql<number>`coalesce(sum(${schema.postReactions.count}), 0)::int`,
      })
      .from(schema.postReactions);
    return rows[0]?.total ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Admin-only: every post's reaction breakdown joined with title.
 * Used by /admin/reactions for the per-post analytics dashboard.
 */
export type PostReactionRow = {
  slug: string;
  title: string;
  counts: ReactionCounts;
  total: number;
};

export async function listAllPostReactions(): Promise<PostReactionRow[]> {
  if (!isConfigured()) return [];
  const rows = await getDb()
    .select({
      slug: schema.postReactions.slug,
      emoji: schema.postReactions.emoji,
      count: schema.postReactions.count,
      title: schema.posts.title,
    })
    .from(schema.postReactions)
    .leftJoin(
      schema.posts,
      sql`${schema.posts.slug} = ${schema.postReactions.slug}`,
    );

  const map = new Map<string, PostReactionRow>();
  for (const r of rows) {
    let entry = map.get(r.slug);
    if (!entry) {
      entry = {
        slug: r.slug,
        title: r.title ?? r.slug,
        counts: emptyReactionCounts(),
        total: 0,
      };
      map.set(r.slug, entry);
    }
    if (isValidEmoji(r.emoji)) {
      entry.counts[r.emoji] = r.count;
      entry.total += r.count;
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}
