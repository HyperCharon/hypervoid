import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { siteConfig } from "@/lib/site-config";

export type Webmention = typeof schema.webmentions.$inferSelect;

/**
 * Stash an incoming webmention as pending. Idempotent on (source, target) —
 * re-submitting the same pair re-runs verification on the existing row.
 */
export async function upsertPending(input: {
  source: string;
  target: string;
  targetSlug: string | null;
}): Promise<string> {
  const db = getDb();
  const existing = await db
    .select({ id: schema.webmentions.id })
    .from(schema.webmentions)
    .where(
      and(
        eq(schema.webmentions.source, input.source),
        eq(schema.webmentions.target, input.target),
      ),
    )
    .limit(1);
  if (existing[0]) {
    await db
      .update(schema.webmentions)
      .set({ status: "pending", targetSlug: input.targetSlug })
      .where(eq(schema.webmentions.id, existing[0].id));
    return existing[0].id;
  }
  const rows = await db
    .insert(schema.webmentions)
    .values({
      source: input.source,
      target: input.target,
      targetSlug: input.targetSlug,
      status: "pending",
    })
    .returning({ id: schema.webmentions.id });
  return rows[0].id;
}

export async function markVerified(
  id: string,
  meta: {
    type?: string;
    content?: string | null;
    authorName?: string | null;
    authorUrl?: string | null;
    authorPhoto?: string | null;
  },
): Promise<void> {
  await getDb()
    .update(schema.webmentions)
    .set({
      status: "verified",
      type: meta.type ?? "mention",
      content: meta.content ?? null,
      authorName: meta.authorName ?? null,
      authorUrl: meta.authorUrl ?? null,
      authorPhoto: meta.authorPhoto ?? null,
      verifiedAt: new Date(),
    })
    .where(eq(schema.webmentions.id, id));
}

export async function markRejected(id: string): Promise<void> {
  await getDb()
    .update(schema.webmentions)
    .set({ status: "rejected" })
    .where(eq(schema.webmentions.id, id));
}

export async function listForSlug(slug: string): Promise<Webmention[]> {
  return getDb()
    .select()
    .from(schema.webmentions)
    .where(
      and(
        eq(schema.webmentions.targetSlug, slug),
        eq(schema.webmentions.status, "verified"),
        eq(schema.webmentions.hidden, false),
      ),
    )
    .orderBy(desc(schema.webmentions.verifiedAt));
}

/** Admin listing — every row, newest first, regardless of status / hidden. */
export async function listAllWebmentions(): Promise<Webmention[]> {
  return getDb()
    .select()
    .from(schema.webmentions)
    .orderBy(desc(schema.webmentions.createdAt));
}

export async function setWebmentionHidden(
  id: string,
  hidden: boolean,
): Promise<void> {
  await getDb()
    .update(schema.webmentions)
    .set({ hidden })
    .where(eq(schema.webmentions.id, id));
}

export async function deleteWebmention(id: string): Promise<void> {
  await getDb()
    .delete(schema.webmentions)
    .where(eq(schema.webmentions.id, id));
}

const PRIVATE_HOST_RE =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.|::1|fc[0-9a-f]{2}:|fe[89ab][0-9a-f]:)/i;

/**
 * Validate a URL belongs to our public site. Rejects local/private hosts so
 * we don't accidentally treat a localhost link as a valid target.
 */
export function targetSlugFromUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  const siteHost = new URL(siteConfig.url).hostname;
  if (parsed.hostname !== siteHost) return null;
  const m = parsed.pathname.match(/^\/posts\/([\w-]+)\/?$/);
  return m?.[1] ?? null;
}

export function isFetchableSource(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return false;
  }
  if (PRIVATE_HOST_RE.test(parsed.hostname)) return false;
  return true;
}

/**
 * Fetch the source URL and verify it links to `target`. Extracts minimal
 * h-entry-like metadata if present. 5s timeout, 512KB cap.
 */
export async function verifySource(
  source: string,
  target: string,
): Promise<
  | {
      ok: true;
      content: string | null;
      authorName: string | null;
      authorUrl: string | null;
      authorPhoto: string | null;
    }
  | { ok: false; reason: string }
> {
  if (!isFetchableSource(source)) {
    return { ok: false, reason: "source URL not fetchable" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  let response: Response;
  try {
    response = await fetch(source, {
      signal: controller.signal,
      redirect: "error",
      headers: { "User-Agent": "Hypervoid-Webmentions/1.0" },
    });
  } catch (e) {
    clearTimeout(timer);
    return {
      ok: false,
      reason: e instanceof Error ? e.message : String(e),
    };
  }
  clearTimeout(timer);
  if (!response.ok) {
    return { ok: false, reason: `source fetch ${response.status}` };
  }
  const reader = response.body?.getReader();
  if (!reader) return { ok: false, reason: "no body" };

  const decoder = new TextDecoder("utf-8", { fatal: false });
  let html = "";
  const MAX = 512 * 1024;
  while (html.length < MAX) {
    const { done, value } = await reader.read();
    if (done) break;
    html += decoder.decode(value, { stream: true });
  }
  try {
    await reader.cancel();
  } catch {
    /* noop */
  }

  // Verification: target URL must appear inside <a href> or <link href>.
  // Cheap regex on raw HTML — we just need to confirm presence, not parse.
  const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const linkRe = new RegExp(
    `(?:href|src)\\s*=\\s*["']${escapedTarget}["']`,
    "i",
  );
  if (!linkRe.test(html)) {
    return { ok: false, reason: "target link not found in source" };
  }

  // Best-effort metadata extraction.
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const ogTitleMatch = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
  );
  const authorMatch =
    html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(
      /<meta[^>]+property=["']article:author["'][^>]+content=["']([^"']+)["']/i,
    );
  const descMatch =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    ) ??
    html.match(
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    );
  const ogImageMatch = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
  );

  let content =
    (ogTitleMatch?.[1] ?? titleMatch?.[1] ?? descMatch?.[1] ?? null)?.trim() ??
    null;
  if (content && content.length > 500) content = content.slice(0, 497) + "…";

  return {
    ok: true,
    content,
    authorName: authorMatch?.[1] ?? null,
    authorUrl: source,
    authorPhoto: ogImageMatch?.[1] ?? null,
  };
}