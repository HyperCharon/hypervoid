import "server-only";

import { randomUUID } from "node:crypto";
import { del, put } from "@vercel/blob";
import { desc, eq, sql as drizzleSql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { isBlobConfigured } from "@/lib/blob";

const TABLE_LIST = [
  "posts",
  "postViews",
  "postLikes",
  "postReactions",
  "subscribers",
  "friends",
  "guestbookMessages",
  "albums",
  "photos",
  "siteOverrides",
  "customTheme",
  "announcements",
  "redirects",
  "auditLog",
  "resources",
  "rateLimits",
  "aiUsage",
  "aiCustomModels",
  "webmentions",
  "linkChecks",
  "searchLog",
  "series",
  "dbBackups",
] as const;

type DbBackupRow = typeof schema.dbBackups.$inferSelect;

export async function listBackups(): Promise<DbBackupRow[]> {
  return getDb()
    .select()
    .from(schema.dbBackups)
    .orderBy(desc(schema.dbBackups.createdAt));
}

export async function createBackup(): Promise<DbBackupRow> {
  if (!isBlobConfigured()) {
    throw new Error("BLOB_READ_WRITE_TOKEN 未配置，无法上传备份");
  }

  const db = getDb();
  const tables: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};

  for (const name of TABLE_LIST) {
    try {
      const t = schema[name as keyof typeof schema] as {
        $inferSelect?: unknown;
      };
      if (!t) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = await db.select().from(t as any);
      tables[name] = rows;
      counts[name] = rows.length;
    } catch {
      counts[name] = -1;
      // skip silently — partial backups still valuable
    }
  }

  const payload = JSON.stringify(
    { exportedAt: new Date().toISOString(), tables },
    null,
    2,
  );
  const body = Buffer.from(payload, "utf-8");
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const pathname = `backups/hypervoid-${ts}-${randomUUID().slice(0, 8)}.json`;

  const result = await put(pathname, body, {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    cacheControlMaxAge: 0,
  });

  const [row] = await db
    .insert(schema.dbBackups)
    .values({
      url: result.url,
      pathname,
      sizeBytes: body.byteLength,
      tableCounts: counts,
    })
    .returning();
  return row;
}

export async function deleteBackupRecord(id: string): Promise<void> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.dbBackups)
    .where(eq(schema.dbBackups.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return;
  try {
    await del(row.url);
  } catch {
    // blob may already be gone — proceed to drop the row
  }
  await db.delete(schema.dbBackups).where(eq(schema.dbBackups.id, id));
}

export async function countBackups(): Promise<{ count: number; bytes: number }> {
  const [row] = await getDb()
    .select({
      count: drizzleSql<number>`count(*)::int`,
      bytes: drizzleSql<number>`coalesce(sum(${schema.dbBackups.sizeBytes}), 0)::bigint`,
    })
    .from(schema.dbBackups);
  return {
    count: row?.count ?? 0,
    bytes: Number(row?.bytes ?? 0),
  };
}
