import "server-only";

import { and, desc, eq, like, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { auth } from "@/auth";

type AuditLogRow = typeof schema.auditLog.$inferSelect;

/**
 * Best-effort logger — never throws, so it can wrap admin actions without
 * affecting their success path. Captures the actor from the current session
 * automatically; pass `actor` to override (e.g. for cron jobs).
 */
export async function recordAudit(input: {
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  actor?: string;
}): Promise<void> {
  try {
    let actor = input.actor;
    if (!actor) {
      const session = await auth();
      const user = session?.user as { login?: string } | undefined;
      actor = user?.login ?? "unknown";
    }
    await getDb().insert(schema.auditLog).values({
      actor,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      details: input.details ?? null,
    });
  } catch {
    // swallow — audit is best-effort
  }
}

export async function listAuditLog(
  limit = 200,
  filters?: {
    actor?: string;
    actionPrefix?: string;
    targetType?: string;
  },
): Promise<AuditLogRow[]> {
  const conds = [];
  if (filters?.actor) conds.push(eq(schema.auditLog.actor, filters.actor));
  if (filters?.actionPrefix) {
    conds.push(like(schema.auditLog.action, `${filters.actionPrefix}%`));
  }
  if (filters?.targetType) {
    conds.push(eq(schema.auditLog.targetType, filters.targetType));
  }
  return getDb()
    .select()
    .from(schema.auditLog)
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(desc(schema.auditLog.createdAt))
    .limit(limit);
}

/** Distinct actor / action-prefix / targetType values, for filter dropdowns. */
export async function getAuditFacets(): Promise<{
  actors: string[];
  actionPrefixes: string[];
  targetTypes: string[];
}> {
  // Use SQL DISTINCT to avoid fetching thousands of rows into JS.
  const [actorRows, targetRows] = await Promise.all([
    getDb()
      .selectDistinct({ actor: schema.auditLog.actor })
      .from(schema.auditLog)
      .orderBy(schema.auditLog.actor),
    getDb()
      .selectDistinct({ targetType: schema.auditLog.targetType })
      .from(schema.auditLog)
      .where(sql`${schema.auditLog.targetType} IS NOT NULL`)
      .orderBy(schema.auditLog.targetType),
  ]);

  // Action prefixes need JS-side extraction (split on ".").
  const actionRows = await getDb()
    .selectDistinct({ action: schema.auditLog.action })
    .from(schema.auditLog);

  const actionPrefixes = new Set<string>();
  for (const r of actionRows) {
    const prefix = r.action.split(".")[0];
    if (prefix) actionPrefixes.add(prefix);
  }

  return {
    actors: actorRows.map((r) => r.actor),
    actionPrefixes: [...actionPrefixes].sort(),
    targetTypes: targetRows.map((r) => r.targetType!),
  };
}
