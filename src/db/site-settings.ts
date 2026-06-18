import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";

// In-memory cache for site settings that rarely change.
// 60-second TTL matches site-config-server.ts pattern.
const _cache = new Map<string, { value: string | null; ts: number }>();
const CACHE_TTL_MS = 60_000;

export async function getSiteSetting(key: string): Promise<string | null> {
  const cached = _cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.value;

  const rows = await getDb()
    .select({ value: schema.siteOverrides.value })
    .from(schema.siteOverrides)
    .where(eq(schema.siteOverrides.key, key))
    .limit(1);
  const value = rows[0]?.value ?? null;
  _cache.set(key, { value, ts: Date.now() });
  return value;
}

export async function setSiteSetting(key: string, value: string): Promise<void> {
  await getDb()
    .insert(schema.siteOverrides)
    .values({ key, value })
    .onConflictDoUpdate({
      target: schema.siteOverrides.key,
      set: { value, updatedAt: new Date() },
    });
  _cache.delete(key); // invalidate cache on write
}

/**
 * Returns the login policy: "optional" (default), "required", or "private_only".
 */
export async function getLoginPolicy(): Promise<"optional" | "required" | "private_only"> {
  const val = await getSiteSetting("site_login_required");
  if (val === "required" || val === "private_only") return val;
  return "optional";
}

/** @deprecated Use getLoginPolicy() instead */
export async function isSiteLoginRequired(): Promise<boolean> {
  const policy = await getLoginPolicy();
  return policy === "required";
}
