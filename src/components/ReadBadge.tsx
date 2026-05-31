"use client";

import { Check } from "lucide-react";
import { useReadPosts } from "@/lib/use-read-posts";
import { useT } from "@/components/LocaleProvider";

export function ReadBadge({ slug }: { slug: string }) {
  const t = useT();
  const read = useReadPosts();
  if (!read.has(slug)) return null;
  return (
    <span
      className="hv-chip shrink-0 gap-1 text-xs"
      title={t.post.readBadgeTitle}
    >
      <Check className="h-3 w-3" aria-hidden />
      {t.post.read}
    </span>
  );
}
