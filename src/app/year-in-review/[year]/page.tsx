import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, Heart } from "lucide-react";
import { getYearInReview } from "@/lib/stats";
import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

type Params = { year: string };

const MONTH_NAMES = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

export async function generateMetadata(
  props: { params: Promise<Params> },
): Promise<Metadata> {
  const { year } = await props.params;
  const y = Number(year);
  return {
    title: `${y} 年度回顾`,
    description: `${siteConfig.name} 在 ${y} 年的文字、阅读与反应`,
  };
}

export default async function YearInReviewPage(props: {
  params: Promise<Params>;
}) {
  const { year } = await props.params;
  const y = Number(year);
  if (!Number.isFinite(y) || y < 2020 || y > 3000) notFound();

  const data = await getYearInReview(y);
  const maxMonthly =
    Math.max(1, ...data.monthly.map((m) => m.count)) || 1;
  const isEmpty = data.postCount === 0;

  return (
    <div className="mx-auto flex  flex-col gap-10 py-2">
      <header className="hv-panel relative overflow-hidden p-6 text-center sm:p-8">
        <p className="hv-kicker justify-center">
          Year in Review
        </p>
        <h1 className="hv-title mt-2 font-black tracking-tight">
          <span className="block text-5xl sm:text-7xl">{y}</span>
          <span className="mt-2 block text-base text-muted sm:text-lg">
            {siteConfig.name} 的一年
          </span>
        </h1>
      </header>

      {isEmpty ? (
        <p className="hv-panel border-dashed p-6 text-center text-muted sm:p-10 lg:p-12">
          {y} 年还没有公开发布的文章。
        </p>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="文章" value={data.postCount} suffix="篇" />
            <Stat label="字数" value={data.totalWords} suffix="字" />
            <Stat label="反应" value={data.totalReactions} suffix="次" />
            <Stat label="阅读量" value={data.totalViews} suffix="次" />
          </section>

          <section className="hv-panel p-6">
            <p className="text-xs uppercase tracking-wider text-muted">
              累计阅读时长
            </p>
            <p className="mt-2 font-mono text-3xl font-bold text-foreground">
              {Math.floor(data.totalReadingMinutes / 60)}{" "}
              <span className="text-base font-normal text-muted-soft">小时</span>{" "}
              {data.totalReadingMinutes % 60}{" "}
              <span className="text-base font-normal text-muted-soft">分钟</span>
            </p>
            <p className="mt-1 text-xs text-muted-soft">
              按平均 250 字 / 分钟估算（不含代码块）
            </p>
          </section>

          <section className="hv-panel p-6">
            <h2 className="mb-4 text-sm font-semibold tracking-tight text-muted">
              月度发文分布
            </h2>
            <div className="flex h-32 items-end gap-1.5">
              {data.monthly.map((m) => {
                const pct = (m.count / maxMonthly) * 100;
                return (
                  <div
                    key={m.month}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <div className="flex h-full w-full items-end">
                      <div
                        className="w-full bg-accent/45 shadow-[0_0_16px_var(--accent-glow)] transition hover:bg-accent/80"
                        style={{ height: `${pct}%` }}
                        title={`${MONTH_NAMES[m.month - 1]}: ${m.count} 篇`}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-muted-soft">
                      {m.count > 0 ? m.count : ""}
                    </span>
                    <span className="text-[10px] text-muted-soft">
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {data.topPosts.length > 0 ? (
            <section className="hv-panel p-6">
              <h2 className="mb-4 text-sm font-semibold tracking-tight text-muted">
                最受欢迎的 5 篇
              </h2>
              <ol className="flex flex-col gap-2">
                {data.topPosts.map((p, i) => (
                  <li
                    key={p.slug}
                    className="flex items-center gap-3 border border-border bg-white/[0.035] px-3 py-2"
                  >
                    <span className="font-mono text-lg font-bold text-foreground">
                      {i + 1}
                    </span>
                    <Link
                      href={`/posts/${p.slug}`}
                      className="min-w-0 flex-1 truncate text-sm font-medium text-foreground hover:text-foreground"
                    >
                      {p.title}
                    </Link>
                    <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] text-muted-soft">
                      <Eye className="inline h-3.5 w-3.5" aria-hidden /> {p.views} / <Heart className="inline h-3.5 w-3.5" aria-hidden /> {p.reactions}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {data.topTags.length > 0 ? (
            <section className="hv-panel p-6">
              <h2 className="mb-4 text-sm font-semibold tracking-tight text-muted">
                高频标签
              </h2>
              <div className="flex flex-wrap gap-2">
                {data.topTags.map((t) => (
                  <Link
                    key={t.tag}
                    href={`/tags/${encodeURIComponent(t.tag)}`}
                    className="hv-chip gap-1.5 px-3 py-1 text-xs transition hover:border-border hover:text-foreground"
                  >
                    <span>#{t.tag}</span>
                    <span className="font-mono text-[10px] text-muted-soft">
                      ×{t.count}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      <nav className="flex items-center justify-between border-t border-border pt-6 text-xs text-muted">
        <Link
          href={`/year-in-review/${y - 1}`}
          className="hv-action min-h-8 px-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {y - 1} 年
        </Link>
        <Link href="/" className="hv-action min-h-8 px-3">
          返回首页
        </Link>
        <Link
          href={`/year-in-review/${y + 1}`}
          className="hv-action min-h-8 px-3"
        >
          {y + 1} 年 <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </nav>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="hv-panel p-4">
      <p className="hv-kicker">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-bold leading-tight text-foreground">
        {value.toLocaleString("en-US")}
        {suffix ? (
          <span className="ml-1 text-xs font-normal text-muted-soft">
            {suffix}
          </span>
        ) : null}
      </p>
    </div>
  );
}
