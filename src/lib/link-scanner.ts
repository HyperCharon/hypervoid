import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { upsertLinkCheck } from "@/db/link-checks";

const URL_REGEX = /https?:\/\/[^\s)<>"'`]+/gi;
const TRAILING_PUNCT = /[.,;:!?)]+$/;

const PROBE_TIMEOUT_MS = 8000;
const CONCURRENCY = 6;

const PRIVATE_HOST_RE =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.|::1|fc[0-9a-f]{2}:|fe[89ab][0-9a-f]:)/i;

export function extractUrls(markdown: string): string[] {
  const out = new Set<string>();
  for (const match of markdown.matchAll(URL_REGEX)) {
    let u = match[0].replace(TRAILING_PUNCT, "");
    // strip trailing closing bracket if not balanced
    const opens = (u.match(/\(/g) ?? []).length;
    const closes = (u.match(/\)/g) ?? []).length;
    if (closes > opens) u = u.replace(/\)+$/, "");
    out.add(u);
  }
  return [...out];
}

async function probe(url: string): Promise<{
  status: number | null;
  errorMessage: string | null;
}> {
  // SSRF guard — refuse to fetch private/internal hosts.
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { status: null, errorMessage: "invalid url" };
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { status: null, errorMessage: "unsupported protocol" };
  }
  if (PRIVATE_HOST_RE.test(parsed.hostname)) {
    return { status: null, errorMessage: "private host blocked" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "Hypervoid-LinkCheck/1.0" },
    });
    // Some servers reject HEAD with 405/403; retry GET for those.
    if (res.status === 405 || res.status === 403 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "user-agent": "Hypervoid-LinkCheck/1.0" },
      });
    }
    return { status: res.status, errorMessage: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { status: null, errorMessage: msg.slice(0, 200) };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sweeps every public+published post's external links and upserts results.
 * Returns the number of distinct URLs checked. Bounded concurrency keeps
 * the run within Vercel's 60s serverless ceiling for ~100 URLs.
 */
export async function runLinkCheck(): Promise<{
  checked: number;
  ok: number;
  broken: number;
}> {
  const rows = await getDb()
    .select({ slug: schema.posts.slug, content: schema.posts.content })
    .from(schema.posts)
    .where(
      and(
        eq(schema.posts.status, "published"),
        eq(schema.posts.visibility, "public"),
      ),
    );

  const urlToSlugs = new Map<string, Set<string>>();
  for (const r of rows) {
    for (const u of extractUrls(r.content ?? "")) {
      const set = urlToSlugs.get(u) ?? new Set<string>();
      set.add(r.slug);
      urlToSlugs.set(u, set);
    }
  }

  const urls = [...urlToSlugs.keys()];
  let ok = 0;
  let broken = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < urls.length) {
      const i = cursor++;
      const url = urls[i];
      const result = await probe(url);
      const isOk =
        result.status !== null && result.status >= 200 && result.status < 400;
      if (isOk) ok++;
      else broken++;
      await upsertLinkCheck({
        url,
        status: result.status,
        errorMessage: result.errorMessage,
        postSlugs: [...(urlToSlugs.get(url) ?? new Set<string>())],
      });
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker),
  );

  return { checked: urls.length, ok, broken };
}
