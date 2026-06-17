"use client";

import { Clock3 } from "lucide-react";
import { useReadLater } from "@/lib/use-read-later";
import { useT } from "@/components/LocaleProvider";

export function ReadLaterButton({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description?: string | null;
}) {
  const t = useT();
  const { isQueued, toggle, ready } = useReadLater();
  const active = ready && isQueued(slug);

  return (
    <button
      type="button"
      onClick={() => toggle({ slug, title, description })}
      aria-label={active ? t.readLater.remove : t.readLater.add}
      title={active ? t.readLater.added : t.readLater.hint}
      className={"hv-action h-9 w-9 p-0 shrink-0 " + (
        active ? "border-accent bg-accent/14 text-foreground" : ""
      )}
    >
      <Clock3 aria-hidden className="h-4 w-4" />
    </button>
  );
}
