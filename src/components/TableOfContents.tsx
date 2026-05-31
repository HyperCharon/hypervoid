"use client";

import { useEffect, useState } from "react";
import type { TOCItem } from "@/lib/toc";
import { useT } from "@/components/LocaleProvider";

export function TableOfContents({ items }: { items: TOCItem[] }) {
  const t = useT();
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (items.length === 0) return;
    const headings = items
      .map(({ id }) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  const minDepth = Math.min(...items.map((i) => i.depth));

  return (
    <nav aria-label={t.common.tableOfContents} className="text-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-1 w-1 rounded-full bg-accent-soft" />
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent-soft">
          Navigation_Matrix
        </p>
      </div>
      <ul className="flex flex-col gap-0.5 border-l-2 border-border">
        {items.map((item) => {
          const isActive = item.id === activeId;
          const indent = (item.depth - minDepth) * 12;
          return (
            <li key={item.id}>
              <a
                href={"#" + item.id}
                style={{ paddingLeft: indent + 12 }}
                className={
                  "block border-l-2 py-1.5 pr-2 font-mono text-xs transition " +
                  (isActive
                    ? "-ml-0.5 border-accent bg-accent/10 font-semibold text-accent"
                    : "border-transparent text-muted-soft hover:border-border hover:bg-card hover:text-foreground")
                }
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
