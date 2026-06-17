"use client";

import { Bookmark } from "lucide-react";
import { useBookmarks } from "@/lib/use-bookmarks";

export function BookmarkButton({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description?: string | null;
}) {
  const { isBookmarked, toggle, ready } = useBookmarks();
  const active = ready && isBookmarked(slug);

  return (
    <button
      type="button"
      onClick={() => toggle({ slug, title, description })}
      aria-label={active ? "取消收藏" : "收藏文章"}
      title={active ? "取消收藏" : "加入收藏 → /bookmarks"}
      className={"hv-action hv-action-icon shrink-0 " + (
        active ? "border-accent bg-accent/14 text-foreground" : ""
      )}
    >
      <Bookmark
        aria-hidden
        className="h-4 w-4"
        fill={active ? "currentColor" : "none"}
      />
    </button>
  );
}
