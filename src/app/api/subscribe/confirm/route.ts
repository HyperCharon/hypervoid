import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db/client";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function getIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function GET(request: Request) {
  const rl = await rateLimit(getIp(request), {
    key: "subscribe-confirm",
    limit: 20,
    windowSec: 600,
  });
  if (!rl.ok) {
    redirect("/subscribe/result?status=rate-limited");
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    redirect("/subscribe/result?status=missing");
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(schema.subscribers)
    .where(eq(schema.subscribers.verifyToken, token))
    .limit(1);

  const row = rows[0];
  if (!row) {
    redirect("/subscribe/result?status=invalid");
  }

  if (row.verified) {
    redirect("/subscribe/result?status=already");
  }

  await db
    .update(schema.subscribers)
    .set({ verified: true, verifiedAt: new Date(), unsubscribedAt: null })
    .where(eq(schema.subscribers.id, row.id));

  redirect("/subscribe/result?status=ok");
}
