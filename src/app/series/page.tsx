import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Layers3 } from "lucide-react";
import { getPublicSeriesList } from "@/lib/series-public";
import { getMessages } from "@/lib/i18n-server";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "系列",
  description: "文章系列 · 多篇文章组成一个主题",
};

export default async function SeriesIndexPage() {
  const [series, t] = await Promise.all([getPublicSeriesList(), getMessages()]);

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="flex items-center gap-2">
          <Layers3 className="h-5 w-5 text-accent" aria-hidden />
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.series.title}</h1>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {t.series.description}
        </p>
        <p className="mt-2 text-xs text-muted">{series.length} {t.series.clusters}</p>
      </header>

      {series.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted">
          {t.series.empty}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {series.map((s) => (
            <Link
              key={s.slug}
              href={`/series/${encodeURIComponent(s.name)}`}
              className="group relative flex min-h-[160px] flex-col justify-end overflow-hidden rounded-2xl border border-border bg-card transition hover:border-accent/30 hover:shadow-md"
            >
              {s.cover ? (
                <>
                  <Image
                    src={s.cover}
                    alt={s.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover opacity-60 transition duration-300 group-hover:scale-105 group-hover:opacity-75"
                  />
                  <div className="hv-series-overlay absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="relative z-10 p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="text-lg font-bold tracking-tight text-white drop-shadow-sm">{s.name}</h2>
                      <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                        {s.count} {t.archive.postsCount}
                      </span>
                    </div>
                    {s.description && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/80">{s.description}</p>}
                    <span className="mt-2 inline-flex items-center gap-1 text-xs text-white/70 group-hover:text-white transition-colors">
                      {t.series.openRoute} <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </div>
                </>
              ) : (
                <div className="relative z-10 p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-lg font-bold tracking-tight">{s.name}</h2>
                    <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      {s.count} {t.archive.postsCount}
                    </span>
                  </div>
                  {s.description && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{s.description}</p>}
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-accent group-hover:text-accent-soft transition-colors">
                    {t.series.openRoute} <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
