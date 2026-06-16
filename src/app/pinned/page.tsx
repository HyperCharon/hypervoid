import type { Metadata } from "next";
import { Pin } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { getAllPostMeta } from "@/lib/posts";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "置顶文章",
  description: "标记为置顶的文章精选",
};

export default async function PinnedPage() {
  const posts = await getAllPostMeta();
  const pinned = posts.filter((p) => p.frontmatter.pinned);

  return (
    <div className="mx-auto flex  flex-col gap-6">
      <header className="hv-panel relative overflow-hidden p-5 sm:p-7">
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <p className="hv-kicker">Pinned signal / editor selection</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="hv-title flex items-center gap-3 text-3xl font-black leading-tight sm:text-5xl">
            <Pin className="h-8 w-8 text-muted sm:h-10 sm:w-10" aria-hidden />
            置顶文章
          </h1>
          <span className="hv-chip hv-chip-strong">
            {pinned.length > 0 ? pinned.length + " selected" : "empty"}
          </span>
        </div>
      </header>

      {pinned.length === 0 ? (
        <div className="hv-panel border-dashed p-6 text-center text-sm text-muted sm:p-10 lg:p-12">
          <Pin className="mx-auto h-9 w-9 text-muted-soft" aria-hidden />
          <p className="mt-3">
            管理员可以在文章编辑器中勾选&ldquo;置顶&rdquo;。
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pinned.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
