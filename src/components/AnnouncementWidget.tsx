import { inArray } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { getActiveAnnouncement } from "@/db/announcements";
import { getMessages } from "@/lib/i18n-server";

const LEGACY_KEYS = [
  "announcementMessage",
  "announcementLink",
  "announcementLinkText",
] as const;

async function getLegacyOverrides(): Promise<Record<string, string>> {
  try {
    const rows = await getDb()
      .select({
        key: schema.siteOverrides.key,
        value: schema.siteOverrides.value,
      })
      .from(schema.siteOverrides)
      .where(inArray(schema.siteOverrides.key, [...LEGACY_KEYS]));
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

export async function AnnouncementWidget() {
  const [slotEntry, legacy, t] = await Promise.all([
    getActiveAnnouncement("sidebar").catch(() => null),
    getLegacyOverrides(),
    getMessages(),
  ]);

  const message = slotEntry?.message || legacy.announcementMessage || process.env.ANNOUNCEMENT_MESSAGE || "";
  if (!message) return null;

  const linkHref = slotEntry?.link || legacy.announcementLink || process.env.ANNOUNCEMENT_LINK || "";
  const linkText = slotEntry?.linkText || legacy.announcementLinkText || process.env.ANNOUNCEMENT_LINK_TEXT || "";

  return (
    <div className="hv-card p-4">
      <div className="flex items-center gap-2">
        <span className="relative flex h-5 w-5 items-center justify-center">
          <span className="absolute h-3 w-3 animate-ping rounded-full bg-accent/40" />
          <span className="relative h-2 w-2 rounded-full bg-accent" />
        </span>
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-accent">{t.widget.notice}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p>
      {linkHref ? (
        <a
          href={linkHref}
          className="glow-underline mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent transition hover:text-accent-soft"
        >
          {linkText || t.common.learnMore}
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </a>
      ) : null}
    </div>
  );
}
