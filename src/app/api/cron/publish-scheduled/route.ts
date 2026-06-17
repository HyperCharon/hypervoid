import { and, eq, lt, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return new Response("CRON_SECRET not configured", { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${expected}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rows = await getDb()
    .update(schema.posts)
    .set({ status: "published", updatedAt: new Date() })
    .where(
      and(
        eq(schema.posts.status, "scheduled"),
        lte(schema.posts.publishAt, sql`NOW()`),
      ),
    )
    .returning({ slug: schema.posts.slug });

  if (rows.length > 0) {
    revalidatePath("/");
    revalidatePath("/posts");
    revalidatePath("/tags");
    for (const r of rows) revalidatePath(`/posts/${r.slug}`);
  }

  // Maintenance: prune ephemeral counters so they don't grow unbounded.
  //  - rate_limits older than 24h are irrelevant (every window is much shorter)
  //  - ai_usage older than 90 days is no longer needed for the daily quota
  //    panel (which only reads today's row) but kept around for trends.
  //  - audit_log keeps everything except auto-generated ai.call rows older
  //    than 30 days — admin-action history stays forever, AI call traces
  //    age out so the table doesn't balloon under steady visitor traffic.
  let rateLimitsPurged = 0;
  let aiUsagePurged = 0;
  let aiAuditPurged = 0;
  try {
    const rl = await getDb().execute(
      sql`DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '24 hours'`,
    );
    rateLimitsPurged =
      (rl as unknown as { rowCount?: number }).rowCount ?? 0;
  } catch (e) {
    console.warn("[cron] rate_limits purge failed:", e instanceof Error ? e.message : e);
  }
  try {
    const au = await getDb()
      .delete(schema.aiUsage)
      .where(lt(schema.aiUsage.date, isoDateNDaysAgo(90)))
      .returning({ date: schema.aiUsage.date });
    aiUsagePurged = au.length;
  } catch (e) {
    console.warn("[cron] ai_usage purge failed:", e instanceof Error ? e.message : e);
  }
  try {
    const a = await getDb().execute(
      sql`DELETE FROM audit_log WHERE action = 'ai.call' AND created_at < NOW() - INTERVAL '30 days'`,
    );
    aiAuditPurged = (a as unknown as { rowCount?: number }).rowCount ?? 0;
  } catch (e) {
    console.warn("[cron] audit_log purge failed:", e instanceof Error ? e.message : e);
  }

  return Response.json({
    publishedCount: rows.length,
    publishedSlugs: rows.map((r) => r.slug),
    maintenance: {
      rateLimitsPurged,
      aiUsagePurged,
      aiAuditPurged,
    },
  });
}

function isoDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
