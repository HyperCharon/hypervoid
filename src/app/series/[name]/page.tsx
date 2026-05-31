import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Layers3 } from "lucide-react";
import type { Metadata } from "next";
import { getAllSeries, getPostsBySeries } from "@/lib/posts";
import { getPublicSeriesList } from "@/lib/series-public";
import { SeriesPostList } from "@/components/SeriesPostList";

type Params = { name: string };

export const revalidate = 60;

export async function generateStaticParams(): Promise<Params[]> {
  const list = await getAllSeries();
  return list.map((s) => ({ name: encodeURIComponent(s.name) }));
}

export const dynamicParams = true;

export async function generateMetadata(
  props: { params: Promise<Params> },
): Promise<Metadata> {
  const { name } = await props.params;
  const decoded = decodeURIComponent(name);
  const seriesList = await getPublicSeriesList();
  const series = seriesList.find((s) => s.name === decoded);
  return {
    title: decoded + " · 系列",
    description: series?.description ?? "「" + decoded + "」系列下的所有文章",
  };
}

export default async function SeriesDetailPage(
  props: { params: Promise<Params> },
) {
  const { name } = await props.params;
  const decoded = decodeURIComponent(name);
  const posts = await getPostsBySeries(decoded);
  if (posts.length === 0) notFound();

  const seriesList = await getPublicSeriesList();
  const series = seriesList.find((s) => s.name === decoded);

  return (
    <div className="mx-auto flex  flex-col gap-6">
      <Link href="/series" className="hv-action w-fit px-4 text-sm font-medium">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        所有系列
      </Link>

      <header className="hv-panel relative overflow-hidden p-5 sm:p-7">
        {series?.cover ? (
          <>
            <Image
              src={series.cover}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="hv-cover-img object-cover"
            />
            <div className="hv-cover-overlay absolute inset-0" />
          </>
        ) : null}
        <div className="relative z-10">
          <p className="hv-kicker">Series route / sequential reading</p>
          <h1 className="hv-title mt-2 flex items-center gap-3 text-3xl font-black leading-tight sm:text-5xl">
            <Layers3 className="h-8 w-8 text-muted sm:h-10 sm:w-10" aria-hidden />
            {decoded}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="hv-chip hv-chip-strong">{posts.length} nodes</span>
          </div>
          {series?.description ? (
            <p className="mt-4  text-sm leading-7 text-muted">
              {series.description}
            </p>
          ) : null}
        </div>
      </header>

      <SeriesPostList posts={posts} seriesName={decoded} />
    </div>
  );
}
