"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useT } from "@/components/LocaleProvider";

export function SearchBox({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const t = useT();
  const [q, setQ] = useState(initial || params.get("q") || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form onSubmit={onSubmit} className="relative">
      <input
        ref={inputRef}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t.common.searchPlaceholder}
        className="min-h-11 w-full border border-border bg-card px-3 py-2 pl-10 text-sm text-foreground placeholder:text-muted-soft shadow-[inset_0_1px_0_var(--inset-highlight)] backdrop-blur-xl transition focus:border-border focus:bg-card-hover focus:outline-none"
        aria-label={t.common.search}
      />
      <Search
        aria-hidden="true"
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      />
    </form>
  );
}
