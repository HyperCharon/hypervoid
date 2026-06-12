import type { Metadata } from "next";
import { fetchAllForKind } from "@/lib/bangumi";
import { siteConfig } from "@/lib/site-config";
import { AnimeBrowser } from "@/components/AnimeBrowser";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "影视",
  description: "Bangumi 上的电影和电视剧",
};

export default async function MoviesPage() {
  const all = await fetchAllForKind("real");
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
        <p className="hv-kicker">Films / Bangumi_Theater</p>
        <h1 className="hv-title mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
          影视
        </h1>
        <p className="mt-2 text-sm text-muted">
          {merged.length > 0 ? (
            <>
              在看 {all.watching.total} · 看过 {all.done.total} · 想看{" "}
              {all.wish.total}
              <span className="mx-2">·</span>
            </>
          ) : null}
          数据来自{" "}
          <a
            href={`https://bgm.tv/user/${siteConfig.bangumiUserId}/mono/real`}
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
          ⏳ 还没有影视收藏。去{" "}
          <a
            href={`https://bgm.tv/user/${siteConfig.bangumiUserId}/mono/real`}
            target="_blank"
            rel="noreferrer noopener"
            className="underline hover:text-primary"
          >
            bgm.tv 收藏电影/电视剧
          </a>{" "}
          后这里会自动同步。
        </p>
      ) : (
        <AnimeBrowser
          items={merged}
          searchPlaceholder="🔍 按片名过滤（中文 / 原名）…"
        />
      )}
    </div>
  );
}
