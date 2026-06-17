import "server-only";

import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";

function isConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function getViewCount(slug: string): Promise<number | null> {
  if (!isConfigured()) return null;
  try {
    const rows = await getDb()
      .select({ count: schema.postViews.count })
      .from(schema.postViews)
      .where(eq(schema.postViews.slug, slug))
      .limit(1);
    return rows[0]?.count ?? 0;
  } catch {
    return null;
  }
}

export async function incrementViewCount(
  slug: string,
): Promise<number | null> {
  if (!isConfigured()) return null;
  try {
    const rows = await getDb()
      .insert(schema.postViews)
      .values({ slug, count: 1 })
      .onConflictDoUpdate({
        target: schema.postViews.slug,
        set: {
          count: sql`${schema.postViews.count} + 1`,
          updatedAt: new Date(),
        },
      })
      .returning({ count: schema.postViews.count });
    return rows[0]?.count ?? null;
  } catch {
    return null;
  }
}
