import Link from "next/link";
import { Hash, Tags } from "lucide-react";
import { getAllTags } from "@/lib/posts";
import { getMessages } from "@/lib/i18n-server";

export const revalidate = 60;

export default async function TagsIndex() {
  const [tags, t] = await Promise.all([getAllTags(), getMessages()]);
  return (
    <div className="flex flex-col gap-6">
      <header className="group relative overflow-hidden border border-border bg-gradient-to-br from-card to-background p-5 sm:p-7" style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)' }}>
        {/* Corner accents */}
        <div aria-hidden className="pointer-events-none absolute left-0 top-0 h-px w-24 bg-gradient-to-r from-accent/60 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute left-0 top-0 h-24 w-px bg-gradient-to-b from-accent/60 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">
            {t.tags.kicker}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="flex items-center gap-3 font-mono text-3xl font-black uppercase leading-tight tracking-tight text-foreground sm:text-5xl">
            <Tags className="h-8 w-8 text-accent-soft sm:h-10 sm:w-10" aria-hidden />
            {t.tags.allTags}
          </h1>
          <span className="inline-flex items-center gap-1.5 border border-border bg-accent/15 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-foreground" style={{ clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%)' }}>
            <span className="h-1 w-1 rounded-full bg-accent" />
            {tags.length} {t.tags.channels}
          </span>
        </div>
      </header>
      {tags.length ? (
        <div className="flex flex-wrap gap-2">
          {tags.map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="group inline-flex items-center gap-2 border border-border bg-gradient-to-br from-card to-transparent px-3.5 py-2 text-sm transition hover:border-accent/40 hover:bg-card-hover hover:text-foreground hover:shadow-[0_0_16px_var(--accent-glow)]"
              style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
            >
              <Hash className="h-3.5 w-3.5 text-accent-soft transition group-hover:text-accent-soft" aria-hidden />
              <span className="font-mono text-foreground transition group-hover:text-foreground">{tag}</span>
              <span className="border-l border-border pl-2 font-mono text-xs uppercase tracking-wider text-muted-soft">
                {count}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="border border-dashed border-border bg-card p-8 text-center font-mono text-sm uppercase tracking-wider text-muted" style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)' }}>
          {t.tags.empty}
        </p>
      )}
    </div>
  );
}
