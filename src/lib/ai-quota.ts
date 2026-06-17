import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { recordAudit } from "@/lib/audit";

/**
 * Daily-quota guard + usage tracker for AI calls.
 *
 * Quota is per-provider per-day. Counters live in `ai_usage`; the limit
 * itself is stored in `site_overrides` under `ai.quota.<provider>`. A
 * limit of 0 (or missing key) means "no limit" — preserves backward-compat
 * for installs that haven't touched the new admin panel yet.
 */

const QUOTA_KEY_PREFIX = "ai.quota.";

export type ProviderKey = string;

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

class QuotaExceededError extends Error {
  provider: string;
  used: number;
  limit: number;
  constructor(provider: string, used: number, limit: number) {
    super(
      `今日 ${provider} token 已用 ${used.toLocaleString()} / ${limit.toLocaleString()},已超出每日限额。请到 /admin/ai 调整额度或等次日重置。`,
    );
    this.provider = provider;
    this.used = used;
    this.limit = limit;
    this.name = "QuotaExceededError";
  }
}

export async function getProviderQuota(provider: string): Promise<number> {
  try {
    const rows = await getDb()
      .select()
      .from(schema.siteOverrides)
      .where(eq(schema.siteOverrides.key, QUOTA_KEY_PREFIX + provider))
      .limit(1);
    const raw = rows[0]?.value;
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export async function setProviderQuota(
  provider: string,
  limit: number,
): Promise<void> {
  const value = String(Math.max(0, Math.floor(limit)));
  const now = new Date();
  await getDb()
    .insert(schema.siteOverrides)
    .values({ key: QUOTA_KEY_PREFIX + provider, value, updatedAt: now })
    .onConflictDoUpdate({
      target: schema.siteOverrides.key,
      set: { value, updatedAt: now },
    });
}

export type ProviderUsage = {
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requests: number;
};

export async function getTodayUsage(): Promise<ProviderUsage[]> {
  try {
    const rows = await getDb()
      .select()
      .from(schema.aiUsage)
      .where(eq(schema.aiUsage.date, todayKey()));
    return rows.map((r) => ({
      provider: r.provider,
      promptTokens: r.promptTokens,
      completionTokens: r.completionTokens,
      totalTokens: r.totalTokens,
      requests: r.requests,
    }));
  } catch {
    return [];
  }
}

/**
 * Throws QuotaExceededError if today's total tokens for the provider
 * already meet or exceed the configured limit. No-op when limit == 0.
 */
export async function ensureUnderQuota(provider: string): Promise<void> {
  const limit = await getProviderQuota(provider);
  if (limit <= 0) return;
  const rows = await getDb()
    .select({ totalTokens: schema.aiUsage.totalTokens })
    .from(schema.aiUsage)
    .where(
      and(
        eq(schema.aiUsage.date, todayKey()),
        eq(schema.aiUsage.provider, provider),
      ),
    )
    .limit(1);
  const used = rows[0]?.totalTokens ?? 0;
  if (used >= limit) throw new QuotaExceededError(provider, used, limit);
}

/**
 * Atomically increments today's counters for the provider. Best-effort —
 * never throws; usage tracking failure must not break a successful AI call.
 *
 * Also appends an `ai.call` row to the audit log so /admin/audit can
 * show per-call traces (provider, model id/label, tokens). Audit insert
 * is also swallowed on failure.
 */
export async function recordUsage(
  provider: string,
  tokens: { prompt: number; completion: number },
  meta?: { modelId?: string; modelLabel?: string },
): Promise<void> {
  const total = (tokens.prompt || 0) + (tokens.completion || 0);
  try {
    const date = todayKey();
    const now = new Date();
    await getDb()
      .insert(schema.aiUsage)
      .values({
        date,
        provider,
        promptTokens: tokens.prompt || 0,
        completionTokens: tokens.completion || 0,
        totalTokens: total,
        requests: 1,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [schema.aiUsage.date, schema.aiUsage.provider],
        set: {
          promptTokens: sql`${schema.aiUsage.promptTokens} + ${tokens.prompt || 0}`,
          completionTokens: sql`${schema.aiUsage.completionTokens} + ${
            tokens.completion || 0
          }`,
          totalTokens: sql`${schema.aiUsage.totalTokens} + ${total}`,
          requests: sql`${schema.aiUsage.requests} + 1`,
          updatedAt: now,
        },
      });
  } catch {
    /* swallow — usage tracking is best-effort */
  }

  // Append an audit entry. `actor` is set so recordAudit doesn't try to
  // resolve the current session (most AI calls come from anonymous
  // visitors via Ask AI / Kanna chat).
  await recordAudit({
    action: "ai.call",
    targetType: "ai",
    targetId: meta?.modelId ?? provider,
    actor: "ai",
    details: {
      provider,
      modelLabel: meta?.modelLabel,
      promptTokens: tokens.prompt || 0,
      completionTokens: tokens.completion || 0,
      totalTokens: total,
    },
  });
}

/** Convenience: char-length-based fallback when the provider doesn't return usage. */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Mixed CJK + latin heuristic: ~1.6 chars per token for Chinese,
  // ~4 chars per token for English. Average to ~2.5.
  return Math.ceil(text.length / 2.5);
}
