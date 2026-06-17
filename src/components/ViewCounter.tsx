"use client";

import { useEffect, useState } from "react";
import { recordView } from "@/app/posts/[slug]/actions";
import { useT } from "@/components/LocaleProvider";

export function ViewCounter({
  slug,
  initialCount,
}: {
  slug: string;
  initialCount: number | null;
}) {
  const t = useT();
  const [count, setCount] = useState<number | null>(initialCount);
  const [hasIncremented, setHasIncremented] = useState(false);

  useEffect(() => {
    if (hasIncremented) return;
    setHasIncremented(true);
    recordView(slug).then((newCount) => {
      if (newCount !== null) setCount(newCount);
    }).catch(() => {});
  }, [slug, hasIncremented]);

  if (count === null) return null;

  return (
    <span title={`${count} ${t.post.views}`} className="inline-flex items-center gap-1">
      <svg
        aria-hidden="true"
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      {count}
    </span>
  );
}
