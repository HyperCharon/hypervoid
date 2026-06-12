import type { Metadata } from "next";
import { fetchAllAnime } from "@/lib/bangumi";
import { siteConfig } from "@/lib/site-config";
import { AnimeBrowser } from "@/components/AnimeBrowser";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "番剧追番",
  description: `Bangumi 上的追番记录`,
};

export default async function AnimePage() {
  const all = await fetchAllAnime();
  const merged = [
    ...all.watching.items,
    ...all.done.items,
    ...all.wish.items,
    ...all.onhold.items,
    ...all.dropped.items,
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="hv-panel relative overflow-hidden p-5 sm:p-7">
        <p className="hv-kicker">Anime / Bangumi_Tracking</p>
        <h1 className="hv-title mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
          番剧追番
        </h1>
        <p className="mt-2 text-sm text-muted">
          在看 {all.watching.total} · 看过 {all.done.total} · 想看{" "}
          {all.wish.total}
          {all.onhold.total ? ` · 搁置 ${all.onhold.total}` : ""}
          {all.dropped.total ? ` · 抛弃 ${all.dropped.total}` : ""}
          <span className="mx-2">·</span>
          数据来自{" "}
          <a
            href={`https://bgm.tv/user/${siteConfig.bangumiUserId}/anime`}
            target="_blank"
            rel="noreferrer noopener"
            className="underline hover:text-primary"
          >
            Bangumi @{siteConfig.bangumiUserId}
          </a>
        </p>
      </header>

      {merged.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted">
          ⏳ 还没有追番记录，或 Bangumi 接口暂时不可用。
        </p>
      ) : (
        <AnimeBrowser items={merged} />
      )}
    </div>
  );
}
