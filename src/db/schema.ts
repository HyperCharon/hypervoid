import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const authUsers = pgTable("auth_users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
});

export const authAccounts = pgTable(
  "auth_accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const authVerificationTokens = pgTable(
  "auth_verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const postStatus = pgEnum("post_status", [
  "draft",
  "scheduled",
  "published",
]);

export const postVisibility = pgEnum("post_visibility", [
  "public",
  "private",
]);

export const announcementSlot = pgEnum("announcement_slot", [
  "top",
  "sidebar",
  "article_top",
]);

export const posts = pgTable("posts", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  category: text("category"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  cover: text("cover"),
  summary: text("summary"),
  pinned: boolean("pinned").notNull().default(false),
  status: postStatus("status").notNull().default("draft"),
  visibility: postVisibility("visibility").notNull().default("public"),
  series: text("series"),
  seriesOrder: integer("series_order"),
  /**
   * Precomputed length of `content` (CJK-aware estimate). Stored so list
   * pages can show "X 字" + reading time without SELECTing the full
   * content column. Backfilled by setup-admin-tables.ts on first run.
   */
  wordCount: integer("word_count").notNull().default(0),
  publishAt: timestamp("publish_at", { withTimezone: true }),
  notifiedAt: timestamp("notified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const postViews = pgTable("post_views", {
  slug: text("slug").primaryKey(),
  count: integer("count").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const postLikes = pgTable("post_likes", {
  slug: text("slug").primaryKey(),
  count: integer("count").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Multi-emoji reactions. Replaces postLikes as the source-of-truth for
 * engagement counts; legacy heart counts are migrated as emoji='heart'
 * during admin-tables setup.
 */
export const postReactions = pgTable(
  "post_reactions",
  {
    slug: text("slug").notNull(),
    emoji: text("emoji").notNull(),
    count: integer("count").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.slug, t.emoji] })],
);

export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  verified: boolean("verified").notNull().default(false),
  verifyToken: text("verify_token").notNull(),
  unsubscribeToken: text("unsubscribe_token").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
});

export const friends = pgTable("friends", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  avatar: text("avatar"),
  description: text("description"),
  email: text("email"),
  status: text("status").notNull().default("approved"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const guestbookMessages = pgTable("guestbook_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  githubLogin: text("github_login").notNull(),
  githubName: text("github_name"),
  avatarUrl: text("avatar_url"),
  message: text("message").notNull(),
  hidden: boolean("hidden").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const albums = pgTable("albums", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  displayMode: text("display_mode").notNull().default("wall"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const photos = pgTable("photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  albumId: uuid("album_id").references(() => albums.id, {
    onDelete: "cascade",
  }),
  url: text("url").notNull(),
  caption: text("caption"),
  takenAt: timestamp("taken_at", { withTimezone: true }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Topic collections / series — independent from post frontmatter */
export const series = pgTable("series", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  cover: text("cover"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Runtime overrides for site-config.ts — editable from /admin/settings */
export const siteOverrides = pgTable("site_overrides", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Custom theme — single-row table (id=1) holding light + dark color JSON */
export const customTheme = pgTable("custom_theme", {
  id: integer("id").primaryKey().default(1),
  enabled: boolean("enabled").notNull().default(false),
  light: jsonb("light").$type<Record<string, string>>().notNull().default({}),
  dark: jsonb("dark").$type<Record<string, string>>().notNull().default({}),
  wallpaperDesktop: text("wallpaper_desktop"),
  wallpaperMobile: text("wallpaper_mobile"),
  wallpaperOpacity: integer("wallpaper_opacity").notNull().default(100),
  wallpaperBlur: integer("wallpaper_blur").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Slot-aware announcements with time-window and priority */
export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  slot: announcementSlot("slot").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  linkText: text("link_text"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  priority: integer("priority").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Short-link redirects — /r/<code> → toUrl, with hit counter */
export const redirects = pgTable("redirects", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  toUrl: text("to_url").notNull(),
  note: text("note"),
  hits: integer("hits").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Append-only audit log of admin actions */
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  details: jsonb("details").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Curated resource library — shared links, software, tools. Grouped by
 * free-text `category` on the public /resources page.
 */
export const resources = pgTable("resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  category: text("category").notNull().default("其他"),
  icon: text("icon"),
  hidden: boolean("hidden").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Postgres-backed rate limit counters. Replaces the in-memory Map that
 * was per-Lambda (and therefore useless under Vercel's serverless model
 * where each cold container has its own counter, letting attackers
 * bypass by rotating across instances).
 *
 * One row per (key, identifier) tuple. Each row tracks the current
 * window's start time and request count. A sliding-window approximation
 * — when the window ages out, the next call resets it atomically in the
 * UPSERT statement.
 */
export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    identifier: text("identifier").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true })
      .notNull()
      .defaultNow(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.key, t.identifier] })],
);

/**
 * Per-day AI token usage, broken down by provider. One row per (date,
 * provider) tuple; counters incremented after each chat/chatStream call.
 * `date` is a YYYY-MM-DD string in the server's local TZ so the same
 * "day" lines up regardless of clock drift between Neon and Vercel.
 */
export const aiUsage = pgTable(
  "ai_usage",
  {
    date: text("date").notNull(),
    provider: text("provider").notNull(),
    promptTokens: integer("prompt_tokens").notNull().default(0),
    completionTokens: integer("completion_tokens").notNull().default(0),
    totalTokens: integer("total_tokens").notNull().default(0),
    requests: integer("requests").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.date, t.provider] })],
);

/**
 * Admin-defined custom models (OpenAI-compatible or Anthropic-compatible
 * endpoints). The built-in AI_MODELS list is still shipped; this table
 * lets the operator plug in OpenRouter / SiliconFlow / Ollama / proxied
 * Claude without touching code.
 */
export const aiCustomModels = pgTable("ai_custom_models", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  hint: text("hint"),
  protocol: text("protocol").notNull().default("openai"),
  baseUrl: text("base_url").notNull(),
  upstreamId: text("upstream_id").notNull(),
  apiKey: text("api_key").notNull(),
  extraHeaders: jsonb("extra_headers")
    .$type<Record<string, string>>()
    .notNull()
    .default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Incoming Webmentions (IndieWeb). Each row represents a verified external
 * source URL that links to a post on this site (target). Status flow:
 *   pending → verified  (source fetched and confirmed to contain target URL)
 *   pending → rejected  (verification failed; kept briefly for debugging)
 *   verified → hidden   (admin moderation)
 * Only `verified` (and not hidden) rows are shown publicly.
 */
export const webmentions = pgTable("webmentions", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(),
  target: text("target").notNull(),
  targetSlug: text("target_slug"),
  status: text("status").notNull().default("pending"),
  type: text("type").notNull().default("mention"),
  content: text("content"),
  authorName: text("author_name"),
  authorUrl: text("author_url"),
  authorPhoto: text("author_photo"),
  hidden: boolean("hidden").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
});

/**
 * Crawl results for outbound links in published posts. status: HTTP code
 * (200..599) when reachable, or null when the probe itself failed —
 * errorMessage carries the reason. postSlugs lists every post that links
 * to this URL so admin can click straight to the offending source.
 */
export const linkChecks = pgTable("link_checks", {
  url: text("url").primaryKey(),
  status: integer("status"),
  errorMessage: text("error_message"),
  postSlugs: jsonb("post_slugs").$type<string[]>().notNull().default([]),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * One row per /search query. ipHash is a salted SHA-256 prefix so we can
 * count uniques without storing PII. resultCount lets us flag queries
 * that returned nothing — those are the most interesting signal.
 */
export const searchLog = pgTable("search_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  query: text("query").notNull(),
  resultCount: integer("result_count").notNull().default(0),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * One row per unique GitHub account that has signed in. The `events.signIn`
 * hook in auth.ts UPSERTs this on every login — incrementing `loginCount`
 * and bumping `lastSeenAt`. Admin /stats reads it for the visitor section.
 */
export const visitorLogins = pgTable("visitor_logins", {
  githubLogin: text("github_login").primaryKey(),
  githubName: text("github_name"),
  avatarUrl: text("avatar_url"),
  loginCount: integer("login_count").notNull().default(0),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Metadata for DB snapshots uploaded to Vercel Blob. The actual JSON
 * payload lives at `url`; this table just keeps the index so admin
 * can list / download / delete past snapshots without iterating Blob.
 */
export const dbBackups = pgTable("db_backups", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  pathname: text("pathname").notNull(),
  sizeBytes: integer("size_bytes").notNull().default(0),
  tableCounts: jsonb("table_counts").$type<Record<string, number>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Quick notes (随手记) — admin-only short notes shown on /diary */
export const quickNotes = pgTable("quick_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ───────────────────────────  STUDY TOOLS (考研)  ───────────────────────────
// Private, admin-only mini-app served on study.hypervoid.top. Flashcards use
// SM-2 spaced repetition; the mistake notebook uses a simpler Leitner box.

export const studySubject = pgEnum("study_subject", [
  "politics", // 政治
  "english", // 英语
  "math", // 数学
  "major", // 专业课
]);

export const studyCardState = pgEnum("study_card_state", [
  "new",
  "learning",
  "review",
]);

/** Single-row (id=1) settings: exam date + daily goals. Mirrors customTheme. */
export const studySettings = pgTable("study_settings", {
  id: integer("id").primaryKey().default(1),
  examDate: timestamp("exam_date", { withTimezone: true }), // 考研初试日期
  dailyNewCards: integer("daily_new_cards").notNull().default(20),
  dailyReviewCap: integer("daily_review_cap").notNull().default(200),
  /** Per-subject minute goals: { politics: 60, english: 90, … } */
  dailyMinuteGoals: jsonb("daily_minute_goals")
    .$type<Partial<Record<"politics" | "english" | "math" | "major", number>>>()
    .notNull()
    .default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Flashcard decks (背单词 grouping). */
export const studyDecks = pgTable("study_decks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  subject: studySubject("subject").notNull().default("english"),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Flashcards with SM-2 scheduling state. */
export const studyCards = pgTable("study_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  deckId: uuid("deck_id")
    .notNull()
    .references(() => studyDecks.id, { onDelete: "cascade" }),
  front: text("front").notNull(), // word / prompt
  back: text("back").notNull(), // definition
  notes: text("notes"), // example sentence, mnemonic (KaTeX ok)
  // ── SM-2 state ──
  ease: real("ease").notNull().default(2.5), // ease factor (EF)
  intervalDays: integer("interval_days").notNull().default(0),
  reps: integer("reps").notNull().default(0), // successful reviews in a row
  lapses: integer("lapses").notNull().default(0),
  state: studyCardState("state").notNull().default("new"),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull().defaultNow(),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
  suspended: boolean("suspended").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Review log — one row per rating; powers the heatmap + retention stats. */
export const studyReviews = pgTable("study_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardId: uuid("card_id")
    .notNull()
    .references(() => studyCards.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 0=again 1=hard 2=good 3=easy
  prevIntervalDays: integer("prev_interval_days").notNull().default(0),
  nextIntervalDays: integer("next_interval_days").notNull().default(0),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** 错题本 — mistake notebook with photo + Leitner-box review scheduling. */
export const studyMistakes = pgTable("study_mistakes", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: studySubject("subject").notNull(),
  topic: text("topic"), // chapter / knowledge point
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  questionImage: text("question_image"), // blob url, nullable
  questionText: text("question_text"),
  myAnswer: text("my_answer"),
  correctAnswer: text("correct_answer"),
  analysis: text("analysis"), // 解析 (KaTeX ok)
  // ── Leitner box review (1..5; higher box = longer gap) ──
  box: integer("box").notNull().default(1),
  reviewCount: integer("review_count").notNull().default(0),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  mastered: boolean("mastered").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Study sessions — Pomodoro + per-subject time log (P1). */
export const studySessions = pgTable("study_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: studySubject("subject").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationSec: integer("duration_sec").notNull().default(0),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** MCQ question bank — 政治 selection practice (P1). */
export const studyQuestions = pgTable("study_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: studySubject("subject").notNull().default("politics"),
  stem: text("stem").notNull(),
  options: jsonb("options").$type<string[]>().notNull().default([]), // ["A…","B…",…]
  answer: integer("answer").notNull(), // correct option index (single-choice)
  answerMask: integer("answer_mask"), // bitmask for 多选; null for 单选
  explanation: text("explanation"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** MCQ attempts (P1). */
export const studyAttempts = pgTable("study_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id")
    .notNull()
    .references(() => studyQuestions.id, { onDelete: "cascade" }),
  chosen: integer("chosen").notNull(), // chosen option index (single) …
  chosenMask: integer("chosen_mask"), // … or bitmask (multi)
  correct: boolean("correct").notNull(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});
