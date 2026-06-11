import "server-only";

import { cache } from "react";
import { and, desc, eq, lte, ne, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import {
  estimateReadingTime,
  readingMinutesFromWordCount,
} from "@/lib/reading-time";
import { formatDateCN } from "@/lib/datetime";

type PostFrontmatter = {
  title: string;
  description?: string | null;
  date: string;
  updatedDate: string;
  tags: string[];
  category?: string | null;
  cover?: string | null;
  summary?: string | null;
  pinned?: boolean;
  readingMinutes: number;
  wordCount: number;
  draft?: boolean;
  visibility: "public" | "private";
  series?: string | null;
  seriesOrder?: number | null;
};

export type Post = {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
};

type ViewerOpts = { isAdmin?: boolean };

function visibilityClause(isAdmin: boolean) {
  if (isAdmin) return undefined;
  return eq(schema.posts.visibility, "public");
}

function publishedClause() {
  return or(
    eq(schema.posts.status, "published"),
    and(
      eq(schema.posts.status, "scheduled"),
      lte(schema.posts.publishAt, sql`NOW()`),
    ),
  );
}

function visibleClause(isAdmin: boolean) {
  const vc = visibilityClause(isAdmin);
  const pc = publishedClause();
  return vc ? and(vc, pc) : pc;
}

function toPost(row: typeof schema.posts.$inferSelect): Post {
  const dateSource = row.publishAt ?? row.createdAt;
  // Prefer the stored word_count column; fall back to live estimation for
  // rows where the backfill hasn't run yet.
  const words = row.wordCount > 0 ? row.wordCount : estimateReadingTime(row.content).words;
  const minutes = readingMinutesFromWordCount(words);
  return {
    slug: row.slug,
    content: row.content,
    frontmatter: {
      title: row.title,
      description: row.description,
      date: formatDateCN(dateSource),
      updatedDate: formatDateCN(row.updatedAt),
      tags: row.tags ?? [],
      category: row.category,
      cover: row.cover,
      summary: row.summary,
      pinned: row.pinned,
      wordCount: words,
      readingMinutes: minutes,
      draft: row.status === "draft",
      visibility: row.visibility,
      series: row.series,
      seriesOrder: row.seriesOrder,
    },
  };
}

/**
 * Lightweight projection of a post used by list pages — same shape as
 * Post but with `content` omitted. List queries SELECT only the
 * metadata columns so we don't ship multi-MB of article body bytes
 * from Neon → Vercel just to render PostCard.
 */
export type PostMeta = Omit<Post, "content">;

type PostMetaRow = Omit<typeof schema.posts.$inferSelect, "content">;

function toPostMeta(row: PostMetaRow): PostMeta {
  const dateSource = row.publishAt ?? row.createdAt;
  const words = row.wordCount;
  const minutes = readingMinutesFromWordCount(words);
  return {
    slug: row.slug,
    frontmatter: {
      title: row.title,
      description: row.description,
      date: formatDateCN(dateSource),
      updatedDate: formatDateCN(row.updatedAt),
      tags: row.tags ?? [],
      category: row.category,
      cover: row.cover,
      summary: row.summary,
      pinned: row.pinned,
      wordCount: words,
      readingMinutes: minutes,
      draft: row.status === "draft",
      visibility: row.visibility,
      series: row.series,
      seriesOrder: row.seriesOrder,
    },
  };
}

const META_COLS = {
  slug: schema.posts.slug,
  title: schema.posts.title,
  description: schema.posts.description,
  category: schema.posts.category,
  tags: schema.posts.tags,
  cover: schema.posts.cover,
  summary: schema.posts.summary,
  pinned: schema.posts.pinned,
  status: schema.posts.status,
  visibility: schema.posts.visibility,
  series: schema.posts.series,
  seriesOrder: schema.posts.seriesOrder,
  wordCount: schema.posts.wordCount,
  publishAt: schema.posts.publishAt,
  notifiedAt: schema.posts.notifiedAt,
  createdAt: schema.posts.createdAt,
  updatedAt: schema.posts.updatedAt,
} as const;

const _getAllPostMetaCached = cache(
  async (isAdmin: boolean): Promise<PostMeta[]> => {
    const rows = await getDb()
      .select(META_COLS)
      .from(schema.posts)
      .where(visibleClause(isAdmin))
      .orderBy(
        desc(schema.posts.pinned),
        desc(schema.posts.publishAt),
        desc(schema.posts.createdAt),
      );
    return rows.map(toPostMeta);
  },
);

export async function getAllPostMeta(
  opts: ViewerOpts = {},
): Promise<PostMeta[]> {
  return _getAllPostMetaCached(opts.isAdmin === true);
}

/**
 * Request-scoped cache. `getAllPosts` is called from the home page, the
 * sitemap, related-posts logic, tag/series resolvers, search, etc. — in
 * the worst case a single /posts/[slug] request would trigger 3-4
 * independent full-table reads. React.cache dedupes by argument identity,
 * so we key on a primitive (isAdmin: boolean) instead of the opts object,
 * which otherwise allocates a fresh reference per call site.
 */
const _getAllPostsCached = cache(async (isAdmin: boolean): Promise<Post[]> => {
  const rows = await getDb()
    .select()
    .from(schema.posts)
    .where(visibleClause(isAdmin))
    .orderBy(
      desc(schema.posts.pinned),
      desc(schema.posts.publishAt),
      desc(schema.posts.createdAt),
    );
  return rows.map(toPost);
});

const _getAllPostSlugsCached = cache(
  async (isAdmin: boolean): Promise<string[]> => {
    const rows = await getDb()
      .select({ slug: schema.posts.slug })
      .from(schema.posts)
      .where(visibleClause(isAdmin));
    return rows.map((r) => r.slug);
  },
);

export async function getAllPostSlugs(opts: ViewerOpts = {}): Promise<string[]> {
  return _getAllPostSlugsCached(opts.isAdmin === true);
}

export async function getAllPosts(opts: ViewerOpts = {}): Promise<Post[]> {
  return _getAllPostsCached(opts.isAdmin === true);
}

type PopularPost = {
  slug: string;
  title: string;
  views: number;
};

export async function getPopularPosts(
  limit = 5,
  opts: ViewerOpts = {},
): Promise<PopularPost[]> {
  const rows = await getDb()
    .select({
      slug: schema.posts.slug,
      title: schema.posts.title,
      views: sql<number>`COALESCE(${schema.postViews.count}, 0)::int`,
    })
    .from(schema.posts)
    .leftJoin(schema.postViews, eq(schema.posts.slug, schema.postViews.slug))
    .where(visibleClause(opts.isAdmin === true))
    .orderBy(
      desc(sql`COALESCE(${schema.postViews.count}, 0)`),
      desc(schema.posts.publishAt),
    )
    .limit(limit);
  return rows;
}

export async function getPostBySlug(
  slug: string,
  opts: ViewerOpts = {},
): Promise<Post | null> {
  const rows = await getDb()
    .select()
    .from(schema.posts)
    .where(and(eq(schema.posts.slug, slug), visibleClause(opts.isAdmin === true)))
    .limit(1);
  return rows[0] ? toPost(rows[0]) : null;
}

export type AdjacentPost = {
  slug: string;
  title: string;
  cover: string | null;
  readingMinutes: number;
};

export async function getAdjacentPosts(
  slug: string,
  opts: ViewerOpts = {},
): Promise<{
  prev: AdjacentPost | null;
  next: AdjacentPost | null;
}> {
  // Uses the metadata projection (no article bodies) — this runs on every
  // article render, so pulling full content for prev/next titles was wasteful.
  const all = await getAllPostMeta(opts);
  const i = all.findIndex((r) => r.slug === slug);
  if (i < 0) return { prev: null, next: null };
  const toAdjacent = (p: PostMeta): AdjacentPost => ({
    slug: p.slug,
    title: p.frontmatter.title,
    cover: p.frontmatter.cover ?? null,
    readingMinutes: p.frontmatter.readingMinutes,
  });
  return {
    prev: i > 0 ? toAdjacent(all[i - 1]) : null,
    next: i < all.length - 1 ? toAdjacent(all[i + 1]) : null,
  };
}

export async function getRelatedPosts(
  slug: string,
  tags: string[],
  opts: ViewerOpts = {},
): Promise<PostMeta[]> {
  if (tags.length === 0) return [];
  const all = await getAllPostMeta(opts);
  return all
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      post: p,
      score: p.frontmatter.tags.filter((t) => tags.includes(t)).length,
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.post);
}

/**
 * Find published+visible posts whose body contains an internal link to `slug`.
 * Used to render a "Linked here from…" section. Excludes the post itself and
 * limits to 12 results sorted by publish date desc.
 */
export async function getBacklinks(
  slug: string,
  opts: ViewerOpts = {},
): Promise<PostMeta[]> {
  if (!slug) return [];
  const db = getDb();
  // Match `/posts/<slug>` as URL substring and `[[<slug>]]` wiki-style links.
  // ILIKE for case-insensitivity; the slug regex earlier guarantees no %
  // wildcards inside the slug itself.
  const safeSlug = slug.replace(/[%_]/g, "");
  const urlPattern = `%/posts/${safeSlug}%`;
  const wikiPattern = `%[[${safeSlug}]]%`;
  // Filter on content (ILIKE) but project metadata only — the cards never
  // render the body, so there's no need to ship every matched article's text.
  const rows = await db
    .select(META_COLS)
    .from(schema.posts)
    .where(
      and(
        visibleClause(opts.isAdmin === true),
        ne(schema.posts.slug, slug),
        or(
          sql`${schema.posts.content} ILIKE ${urlPattern}`,
          sql`${schema.posts.content} ILIKE ${wikiPattern}`,
        ),
      ),
    )
    .orderBy(
      desc(schema.posts.publishAt),
      desc(schema.posts.createdAt),
    )
    .limit(12);
  return rows.map((r) => toPostMeta(r));
}

export async function getAllTags(
  opts: ViewerOpts = {},
): Promise<{ tag: string; count: number }[]> {
  const posts = await getAllPosts(opts);
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.frontmatter.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

type GraphNode = {
  slug: string;
  title: string;
  /** out-degree + in-degree, used for visual size */
  degree: number;
  category: string | null;
};

type GraphEdge = {
  source: string;
  target: string;
};

type KnowledgeGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

/**
 * Build a post-to-post link graph. An edge A → B exists when post A's body
 * mentions either `/posts/<B>` or `[[B]]`. Self-loops are skipped.
 *
 * Nodes are limited to posts that participate in at least one edge so the
 * canvas doesn't drown in isolated dots — orphan posts get their own count
 * shown in the page footer.
 */
export async function getKnowledgeGraph(
  opts: ViewerOpts = {},
): Promise<{ graph: KnowledgeGraph; orphanCount: number }> {
  const posts = await getAllPosts(opts);
  const bySlug = new Map(posts.map((p) => [p.slug, p]));
  const edges: GraphEdge[] = [];
  const URL_RE = /\/posts\/([\w-]+)/g;
  const WIKI_RE = /\[\[([\w-]+)\]\]/g;

  for (const p of posts) {
    const text = p.content ?? "";
    const targets = new Set<string>();
    for (const m of text.matchAll(URL_RE)) targets.add(m[1]);
    for (const m of text.matchAll(WIKI_RE)) targets.add(m[1]);
    for (const t of targets) {
      if (t === p.slug) continue;
      if (!bySlug.has(t)) continue;
      edges.push({ source: p.slug, target: t });
    }
  }

  const degree = new Map<string, number>();
  for (const e of edges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }

  const connectedSlugs = new Set<string>([
    ...edges.map((e) => e.source),
    ...edges.map((e) => e.target),
  ]);

  const nodes: GraphNode[] = posts
    .filter((p) => connectedSlugs.has(p.slug))
    .map((p) => ({
      slug: p.slug,
      title: p.frontmatter.title,
      degree: degree.get(p.slug) ?? 0,
      category: p.frontmatter.category ?? null,
    }));

  const orphanCount = posts.length - nodes.length;

  return { graph: { nodes, edges }, orphanCount };
}

export async function getPostsByTag(
  tag: string,
  opts: ViewerOpts = {},
): Promise<Post[]> {
  const posts = await getAllPosts(opts);
  return posts.filter((p) => p.frontmatter.tags.includes(tag));
}

type SearchHit = Post & { score: number };

export async function searchPosts(
  query: string,
  opts: ViewerOpts & {
    tag?: string;
    tags?: string[];
    year?: string;
    from?: string;
    to?: string;
  } = {},
): Promise<SearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const pattern = `%${q}%`;

  const rows = await getDb()
    .select()
    .from(schema.posts)
    .where(
      and(
        visibleClause(opts.isAdmin === true),
        sql`(${schema.posts.title} || ' ' || coalesce(${schema.posts.description}, '') || ' ' || ${schema.posts.content}) ILIKE ${pattern}`,
      ),
    )
    .orderBy(
      sql`GREATEST(
        similarity(${schema.posts.title}, ${q}),
        similarity(coalesce(${schema.posts.description}, ''), ${q}) * 0.6,
        similarity(${schema.posts.content}, ${q}) * 0.3
      ) DESC NULLS LAST`,
      desc(schema.posts.publishAt),
    )
    .limit(50);

  let hits = rows.map((row) => {
    const post = toPost(row);
    return { ...post, score: 0 };
  });

  // Tag filter: legacy single-tag plus new multi-tag intersection.
  const tagSet = new Set<string>();
  if (opts.tag) tagSet.add(opts.tag);
  for (const t of opts.tags ?? []) if (t) tagSet.add(t);
  if (tagSet.size > 0) {
    hits = hits.filter((h) => {
      for (const want of tagSet) {
        if (!h.frontmatter.tags.includes(want)) return false;
      }
      return true;
    });
  }

  if (opts.year) {
    hits = hits.filter((h) => h.frontmatter.date.startsWith(opts.year!));
  }
  if (opts.from) {
    hits = hits.filter((h) => h.frontmatter.date >= opts.from!);
  }
  if (opts.to) {
    hits = hits.filter((h) => h.frontmatter.date <= opts.to!);
  }

  return hits;
}

type SeriesSummary = {
  name: string;
  count: number;
  latestDate: string;
};

export async function getAllSeries(
  opts: ViewerOpts = {},
): Promise<SeriesSummary[]> {
  const posts = await getAllPosts(opts);
  const grouped = new Map<string, { count: number; latest: string }>();
  for (const p of posts) {
    const s = p.frontmatter.series;
    if (!s) continue;
    const entry = grouped.get(s);
    const date = p.frontmatter.date;
    if (entry) {
      entry.count += 1;
      if (date > entry.latest) entry.latest = date;
    } else {
      grouped.set(s, { count: 1, latest: date });
    }
  }
  return [...grouped.entries()]
    .map(([name, v]) => ({ name, count: v.count, latestDate: v.latest }))
    .sort((a, b) => (b.latestDate > a.latestDate ? 1 : -1));
}

export async function getPostsBySeries(
  name: string,
  opts: ViewerOpts = {},
): Promise<Post[]> {
  const all = await getAllPosts(opts);
  return all
    .filter((p) => p.frontmatter.series === name)
    .sort((a, b) => {
      const ao = a.frontmatter.seriesOrder ?? Number.MAX_SAFE_INTEGER;
      const bo = b.frontmatter.seriesOrder ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return a.frontmatter.date.localeCompare(b.frontmatter.date);
    });
}
