"use client";

import { useState, useTransition } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { clearSummaryAction, generateSummaryAction } from "@/app/admin/posts/actions";

export function SummaryPanel({ slug, initialSummary }: { slug: string; initialSummary: string | null }) {
  const [summary, setSummary] = useState<string | null>(initialSummary);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onGenerate = () => {
    setError(null);
    startTransition(async () => {
      const result = await generateSummaryAction(slug);
      if ("error" in result) setError(result.error);
      else setSummary(result.summary);
    });
  };

  const onClear = () => {
    if (!confirm("清除当前摘要？")) return;
    startTransition(async () => {
      await clearSummaryAction(slug);
      setSummary(null);
    });
  };

  return (
    <div className="hv-panel p-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="hv-title inline-flex items-center gap-2 font-medium tracking-normal">
            <Sparkles className="h-4 w-4 text-accent" aria-hidden />
            AI 摘要
          </p>
          <p className="mt-1 text-xs text-muted">
            自动生成 2-3 句中文摘要，展示在文章正文上方
          </p>
        </div>
        <div className="flex gap-2">
          {summary ? (
            <button type="button" onClick={onClear} disabled={pending} className="hv-action min-h-8 px-3 text-xs disabled:opacity-50">
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              清除
            </button>
          ) : null}
          <button type="button" onClick={onGenerate} disabled={pending} className="hv-action min-h-8 px-3 text-xs font-medium disabled:opacity-50">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {pending ? "生成中…" : summary ? "重新生成" : "生成摘要"}
          </button>
        </div>
      </div>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      {summary ? <p className="mt-3 border border-border bg-card p-3 text-sm text-foreground">{summary}</p> : null}
    </div>
  );
}
