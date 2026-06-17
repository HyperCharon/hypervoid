import "server-only";

import { sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { formatDateCN } from "@/lib/datetime";
import { siteConfig } from "@/lib/site-config";

export type SiteStats = {
  posts: number;
  views: number;
  likes: number;
  daysOnline: number;
};

export type HeatmapDay = {
  date: string;
  count: number;
};

export type MonthCalendarCell = {
  day: number;
  date: string;
  isInMonth: boolean;
  isToday: boolean;
  hasPost: boolean;
};

export type MonthCalendar = {
  year: number;
  month: number;
  weeks: MonthCalendarCell[][];
  totalPosts: number;
};

const SITE_START_MS = new Date(
  `${siteConfig.launchedAt}T00:00:00+08:00`,
).getTime();

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function dayOfWeekCN(d: Date): number {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    weekday: "short",
  }).format(d);
  return WEEKDAY_INDEX[wd] ?? 0;
}

export async function getSiteStats(opts: { isAdmin?: boolean } = {}): Promise<SiteStats> {
  const db = getDb();
  const visClause = opts.isAdmin
    ? sql``
    : sql`AND visibility = 'public'`;

  const [postsRow, viewsRow, likesRow] = await Promise.all([
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(schema.posts)
      .where(sql`(status = 'published' OR (status = 'scheduled' AND publish_at <= NOW())) ${visClause}`)
      .then((r) => r[0]),
    db
      .select({ sum: sql<number>`COALESCE(SUM(count), 0)::int` })
      .from(schema.postViews)
      .then((r) => r[0]),
    db
      .select({ sum: sql<number>`COALESCE(SUM(count), 0)::int` })
      .from(schema.postReactions)
      .then((r) => r[0]),
  ]);

  const daysOnline = Math.max(
    1,
    Math.floor((Date.now() - SITE_START_MS) / 86_400_000),
  );

  return {
    posts: postsRow?.count ?? 0,
    views: viewsRow?.sum ?? 0,
    likes: likesRow?.sum ?? 0,
    daysOnline,
  };
}

export async function getPostHeatmap(
  weeks = 16,
  opts: { isAdmin?: boolean } = {},
): Promise<HeatmapDay[]> {
  const db = getDb();
  const visClause = opts.isAdmin
    ? sql``
    : sql`AND visibility = 'public'`;

  const rows = await db
    .select({
      day: sql<string>`TO_CHAR(
        (COALESCE(publish_at, created_at) AT TIME ZONE 'Asia/Shanghai')::date,
        'YYYY-MM-DD'
      )`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(schema.posts)
    .where(
      sql`(status = 'published' OR (status = 'scheduled' AND publish_at <= NOW()))
          ${visClause}
          AND COALESCE(publish_at, created_at) >= NOW() - INTERVAL '${sql.raw(String(weeks + 1))} weeks'`,
    )
    .groupBy(
      sql`(COALESCE(publish_at, created_at) AT TIME ZONE 'Asia/Shanghai')::date`,
    );

  const map = new Map<string, number>();
  for (const r of rows) map.set(r.day, r.count);

  const todayStr = formatDateCN(new Date());
  const todayMs = new Date(`${todayStr}T00:00:00+08:00`).getTime();
  const dow = dayOfWeekCN(new Date(todayMs));
  const endMs = todayMs + (6 - dow) * 86_400_000;
  const startMs = endMs - (weeks * 7 - 1) * 86_400_000;

  const days: HeatmapDay[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const key = formatDateCN(new Date(startMs + i * 86_400_000));
    days.push({ date: key, count: map.get(key) ?? 0 });
  }
  return days;
}

export async function getMonthCalendar(
  year: number,
  month: number,
  opts: { isAdmin?: boolean } = {},
): Promise<MonthCalendar> {
  const db = getDb();
  const visClause = opts.isAdmin
    ? sql``
    : sql`AND visibility = 'public'`;

  const firstOfMonthMs = new Date(
    `${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00+08:00`,
  ).getTime();
  const firstOfNextMonthMs = new Date(
    `${month === 11 ? year + 1 : year}-${String(((month + 1) % 12) + 1).padStart(2, "0")}-01T00:00:00+08:00`,
  ).getTime();

  const rows = await db
    .select({
      day: sql<string>`TO_CHAR(
        (COALESCE(publish_at, created_at) AT TIME ZONE 'Asia/Shanghai')::date,
        'YYYY-MM-DD'
      )`,
    })
    .from(schema.posts)
    .where(
      sql`(status = 'published' OR (status = 'scheduled' AND publish_at <= NOW()))
          ${visClause}
          AND COALESCE(publish_at, created_at) >= ${new Date(firstOfMonthMs).toISOString()}
          AND COALESCE(publish_at, created_at) < ${new Date(firstOfNextMonthMs).toISOString()}`,
    );

  const postDays = new Set(rows.map((r) => r.day));
  const todayKey = formatDateCN(new Date());

  const firstDow = dayOfWeekCN(new Date(firstOfMonthMs));
  const gridStartMs = firstOfMonthMs - firstDow * 86_400_000;

  const weeks: MonthCalendarCell[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: MonthCalendarCell[] = [];
    for (let d = 0; d < 7; d++) {
      const cellMs = gridStartMs + (w * 7 + d) * 86_400_000;
      const cellDate = new Date(cellMs);
      const cellKey = formatDateCN(cellDate);
      const cellMonth = Number(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Shanghai",
          month: "numeric",
        }).format(cellDate),
      ) - 1;
      const cellYear = Number(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Shanghai",
          year: "numeric",
        }).format(cellDate),
      );
      const cellDay = Number(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Shanghai",
          day: "numeric",
        }).format(cellDate),
      );
      const isInMonth = cellMonth === month && cellYear === year;
      week.push({
        day: cellDay,
        date: cellKey,
        isInMonth,
        isToday: cellKey === todayKey,
        hasPost: isInMonth && postDays.has(cellKey),
      });
    }
    weeks.push(week);
  }

  return { year, month, weeks, totalPosts: postDays.size };
}

export type YearInReview = {
  year: number;
  postCount: number;
  totalWords: number;
  totalReactions: number;
  totalViews: number;
  totalReadingMinutes: number;
  monthly: { month: number; count: number }[];
  topPosts: {
    slug: string;
    title: string;
    views: number;
    reactions: number;
    publishedAt: string | null;
  }[];
  topTags: { tag: string; count: number }[];
};

const EMPTY_REVIEW: YearInReview = {
  year: 0,
  postCount: 0,
  totalWords: 0,
  totalReactions: 0,
  totalViews: 0,
  totalReadingMinutes: 1,
  monthly: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0 })),
  topPosts: [],
  topTags: [],
};

export async function getYearInReview(year: number): Promise<YearInReview> {
  const db = getDb();
  const startIso = `${year}-01-01T00:00:00+08:00`;
  const endIso = `${year + 1}-01-01T00:00:00+08:00`;
  const start = new Date(startIso);
  const end = new Date(endIso);

  let rows;
  try {
    rows = await db
      .select({
        slug: schema.posts.slug,
        title: schema.posts.title,
        wordCount: schema.posts.wordCount,
        tags: schema.posts.tags,
        publishAt: schema.posts.publishAt,
        createdAt: schema.posts.createdAt,
      })
      .from(schema.posts)
      .where(
        sql`(status = 'published' OR (status = 'scheduled' AND publish_at <= NOW()))
            AND visibility = 'public'
            AND COALESCE(publish_at, created_at) >= ${start.toISOString()}
            AND COALESCE(publish_at, created_at) < ${end.toISOString()}`,
      );
  } catch (e) {
    console.error("[getYearInReview] query failed:", e);
    return { ...EMPTY_REVIEW, year };
  }

  const slugs = rows.map((r) => r.slug);

  // Per-slug stats joins — fall back to 0 if absent
  const viewMap = new Map<string, number>();
  const reactionMap = new Map<string, number>();
  if (slugs.length > 0) {
    try {
      const [viewRows, reactionRows] = await Promise.all([
        db.select({
          slug: schema.postViews.slug,
          count: schema.postViews.count,
        }).from(schema.postViews).where(sql`${schema.postViews.slug} = ANY(${slugs})`),
        db.select({
          slug: schema.postReactions.slug,
          total: sql<number>`SUM(${schema.postReactions.count})::int`,
        }).from(schema.postReactions)
          .where(sql`${schema.postReactions.slug} = ANY(${slugs})`)
          .groupBy(schema.postReactions.slug),
      ]);
      for (const v of viewRows) viewMap.set(v.slug, v.count);
      for (const r of reactionRows) reactionMap.set(r.slug, r.total);
    } catch (e) {
      console.error("[getYearInReview] stats query failed:", e);
      // Continue with empty maps — page still renders with 0 counts
    }
  }

  let totalWords = 0;
  const tagCounts = new Map<string, number>();
  const monthly: { month: number; count: number }[] = Array.from(
    { length: 12 },
    (_, i) => ({ month: i + 1, count: 0 }),
  );

  for (const row of rows) {
    totalWords += row.wordCount ?? 0;
    for (const tag of row.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
    const dateUsed = row.publishAt ?? row.createdAt;
    if (dateUsed) {
      try {
        // Local CN month
        const m =
          Number(
            new Intl.DateTimeFormat("en-US", {
              timeZone: "Asia/Shanghai",
              month: "numeric",
            }).format(dateUsed),
          ) - 1;
        if (m >= 0 && m < 12) monthly[m].count += 1;
      } catch {
        // Invalid date — skip
      }
    }
  }

  const topPosts = rows
    .map((r) => ({
      slug: r.slug,
      title: r.title,
      views: viewMap.get(r.slug) ?? 0,
      reactions: reactionMap.get(r.slug) ?? 0,
      publishedAt: (r.publishAt ?? r.createdAt)?.toISOString() ?? null,
    }))
    .sort((a, b) => b.views + b.reactions * 10 - (a.views + a.reactions * 10))
    .slice(0, 5);

  const topTags = [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Rough reading-time estimate: 300 CJK chars / 200 words per minute average.
  const totalReadingMinutes = Math.max(1, Math.round(totalWords / 250));

  const totalViews = [...viewMap.values()].reduce((a, b) => a + b, 0);
  const totalReactions = [...reactionMap.values()].reduce((a, b) => a + b, 0);

  return {
    year,
    postCount: rows.length,
    totalWords,
    totalReactions,
    totalViews,
    totalReadingMinutes,
    monthly,
    topPosts,
    topTags,
  };
}
