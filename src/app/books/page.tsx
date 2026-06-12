import type { Metadata } from "next";
import { fetchAllForKind } from "@/lib/bangumi";
import { STATUS_LABEL_BOOK } from "@/lib/bangumi-types";
import { siteConfig } from "@/lib/site-config";
import { AnimeBrowser } from "@/components/AnimeBrowser";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "书籍",
  description: "Bangumi 上的书籍收藏",
};

export default async function BooksPage() {
  const all = await fetchAllForKind("book");
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
        <p className="hv-kicker">Books / Reading_Log</p>
        <h1 className="hv-title mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
          书籍
        </h1>
        <p className="mt-2 text-sm text-muted">
          {merged.length > 0 ? (
            <>
              在读 {all.watching.total} · 读过 {all.done.total} · 想读{" "}
              {all.wish.total}
              <span className="mx-2">·</span>
            </>
          ) : null}
          数据来自{" "}
          <a
            href={`https://bgm.tv/user/${siteConfig.bangumiUserId}/mono/book`}
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
          ⏳ 还没有书籍收藏。去{" "}
          <a
            href={`https://bgm.tv/user/${siteConfig.bangumiUserId}/mono/book`}
            target="_blank"
            rel="noreferrer noopener"
            className="underline hover:text-primary"
          >
            bgm.tv 收藏书籍
          </a>{" "}
          后这里会自动同步。
        </p>
      ) : (
        <AnimeBrowser
          items={merged}
          statusLabels={STATUS_LABEL_BOOK}
          searchPlaceholder="🔍 按书名过滤（中文 / 原名）…"
        />
      )}
    </div>
  );
}
