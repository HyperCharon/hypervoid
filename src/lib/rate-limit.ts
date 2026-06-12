import "server-only";

import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";

/**
 * Postgres-backed rate limit. Each call does one atomic UPSERT that either
 *   (a) starts a new window with count=1, if the existing row's window has
 *       aged out (or the row doesn't exist), or
 *   (b) increments the existing window's counter.
 *
 * Shared across Vercel Lambdas — the previous in-memory Map version was
 * per-container and let attackers bypass limits by rotating cold starts.
 *
 * Failure mode: if Neon is unreachable, an **in-memory fallback** kicks in
 * (per-container). This means the limit isn't globally shared during an
 * outage, but each container still enforces its own ceiling — far better
 * than no limit at all for cost-bearing endpoints (AI, mascot chat).
 * Callers that want strict global limiting can check `dbReachable` and
 * reject when false.
 */

export interface RateLimitOptions {
  /** Max requests within the window. */
  limit: number;
  /** Window duration in seconds. */
  windowSec: number;
  /** Logical bucket (e.g. "subscribe", "guestbook:post"). */
  key: string;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetInSec: number;
  dbReachable: boolean;
}

// ---------------------------------------------------------------------------
// In-memory fallback — per-container sliding window. Only used when the DB
// is unreachable. Stale entries are evicted lazily on access.
// ---------------------------------------------------------------------------

const _memBuckets = new Map<string, { count: number; windowStart: number; windowSec: number }>();

function memRateLimit(
  identifier: string,
  opts: RateLimitOptions,
): RateLimitResult {
  const memKey = `${opts.key}:${identifier}`;
  const now = Date.now() / 1000;
  const bucket = _memBuckets.get(memKey);

  if (!bucket || now - bucket.windowStart >= bucket.windowSec) {
    _memBuckets.set(memKey, { count: 1, windowStart: now, windowSec: opts.windowSec });
    return { ok: true, remaining: opts.limit - 1, resetInSec: opts.windowSec, dbReachable: false };
  }

  bucket.count += 1;
  const resetInSec = Math.max(0, Math.round(bucket.windowStart + bucket.windowSec - now));
  if (bucket.count > opts.limit) {
    return { ok: false, remaining: 0, resetInSec, dbReachable: false };
  }
  return { ok: true, remaining: Math.max(0, opts.limit - bucket.count), resetInSec, dbReachable: false };
}

// Evict stale entries every 5 minutes to bound memory.
let _lastMemPurge = 0;
function maybeEvictMem(): void {
  const now = Date.now() / 1000;
  if (now - _lastMemPurge < 300) return;
  _lastMemPurge = now;
  for (const [k, v] of _memBuckets) {
    if (now - v.windowStart >= v.windowSec) _memBuckets.delete(k);
  }
}

// ---------------------------------------------------------------------------
// Primary: Postgres-backed rate limit
// ---------------------------------------------------------------------------

export async function rateLimit(
  identifier: string,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  try {
    const rows = await getDb().execute<{
      count: number;
      reset_in_sec: number;
    }>(sql`
      INSERT INTO rate_limits (key, identifier, window_start, count)
      VALUES (${opts.key}, ${identifier}, NOW(), 1)
      ON CONFLICT (key, identifier) DO UPDATE SET
        count = CASE
          WHEN rate_limits.window_start < NOW() - (${opts.windowSec} || ' seconds')::interval
          THEN 1
          ELSE rate_limits.count + 1
        END,
        window_start = CASE
          WHEN rate_limits.window_start < NOW() - (${opts.windowSec} || ' seconds')::interval
          THEN NOW()
          ELSE rate_limits.window_start
        END
      RETURNING
        count,
        GREATEST(
          0,
          EXTRACT(EPOCH FROM (window_start + (${opts.windowSec} || ' seconds')::interval - NOW()))
        )::int AS reset_in_sec;
    `);

    const row = (rows.rows ?? rows)[0] as
      | { count: number; reset_in_sec: number }
      | undefined;
    if (!row) {
      return {
        ok: true,
        remaining: opts.limit - 1,
        resetInSec: opts.windowSec,
        dbReachable: true,
      };
    }
    const count = Number(row.count);
    const resetInSec = Number(row.reset_in_sec);
    if (count > opts.limit) {
      return { ok: false, remaining: 0, resetInSec, dbReachable: true };
    }
    return {
      ok: true,
      remaining: Math.max(0, opts.limit - count),
      resetInSec,
      dbReachable: true,
    };
  } catch {
    // DB unreachable — fall back to per-container in-memory limiter.
    maybeEvictMem();
    return memRateLimit(identifier, opts);
  }
}

/**
 * Periodic-cleanup helper — not run automatically. Hook into your existing
 * cron if you want to keep the table small; otherwise stale rows just sit
 * idle. Returns the number of rows deleted.
 */
export async function purgeStaleRateLimits(): Promise<number> {
  try {
    const res = await getDb().execute(sql`
      DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '24 hours';
    `);
    return (res as unknown as { rowCount?: number }).rowCount ?? 0;
  } catch {
    return 0;
  }
}
