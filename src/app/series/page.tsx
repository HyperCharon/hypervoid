import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Layers3 } from "lucide-react";
import { getPublicSeriesList } from "@/lib/series-public";
import { getMessages } from "@/lib/i18n-server";

export const revalidate = 60;

export default async function SeriesIndexPage() {
  const [series, t] = await Promise.all([getPublicSeriesList(), getMessages()]);

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
            {t.series.kicker}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="flex items-center gap-3 font-mono text-3xl font-black uppercase leading-tight tracking-tight text-foreground sm:text-5xl">
            <Layers3 className="h-8 w-8 text-accent-soft sm:h-10 sm:w-10" aria-hidden />
            {t.series.title}
          </h1>
          <span className="inline-flex items-center gap-1.5 border border-border bg-accent/15 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-foreground" style={{ clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%)' }}>
            <span className="h-1 w-1 rounded-full bg-accent" />
            {series.length} {t.series.clusters}
          </span>
        </div>
        <p className="mt-3 text-sm leading-7 text-muted">
          {t.series.description}
        </p>
      </header>

      {series.length === 0 ? (
        <p className="border border-dashed border-border bg-card p-8 text-center font-mono text-sm uppercase tracking-wider text-muted" style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)' }}>
          {t.series.empty}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {series.map((s) => (
            <Link
              key={s.slug}
              href={`/series/${encodeURIComponent(s.name)}`}
              className="group relative flex min-h-[180px] flex-col justify-end overflow-hidden border border-border bg-gradient-to-br from-card to-background p-5 transition hover:border-accent/35 hover:shadow-[0_0_24px_var(--accent-glow)]"
              style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)' }}
            >
              {/* Corner accent */}
              <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-px w-16 bg-gradient-to-l from-accent/50 to-transparent" />
              <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-16 w-px bg-gradient-to-b from-accent/50 to-transparent" />

              {s.cover ? (
                <>
                  <Image
                    src={s.cover}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover opacity-[0.58] saturate-[0.82] transition duration-500 group-hover:scale-105 group-hover:opacity-[0.74] group-hover:saturate-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,var(--accent-glow)_0_1px,transparent_1px_4px)] opacity-[0.12]" />
                </>
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,var(--accent-glow),transparent_35%),linear-gradient(135deg,rgba(255,255,255,.07),transparent)]" />
              )}
              <div className="relative z-10 flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg font-bold tracking-tight text-foreground transition group-hover:text-foreground">
                    {s.name}
                  </h2>
                  <span className="inline-flex shrink-0 items-center gap-1 border border-border bg-card px-2 py-0.5 font-mono text-xs uppercase tracking-wider text-muted" style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)' }}>
                    {s.count} {t.archive.postsCount}
                  </span>
                </div>
                {s.description ? (
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted">
                    {s.description}
                  </p>
                ) : null}
                <span className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-accent-soft transition group-hover:text-accent-soft">
                  {t.series.openRoute} <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
