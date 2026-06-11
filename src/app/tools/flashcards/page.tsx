import Link from "next/link";
import { listDecksWithCounts } from "@/db/study-decks";
import { getToolsBase } from "@/lib/study/server";
import { SUBJECTS, SUBJECT_LABELS, subjectLabel } from "@/lib/study/subjects";
import { createDeckAction } from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";

export default async function FlashcardsPage() {
  const [base, decks] = await Promise.all([
    getToolsBase(),
    listDecksWithCounts(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">背单词</h1>

      {decks.length === 0 ? (
        <p className="text-sm text-muted">还没有牌组，先新建一个。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {decks.map((d) => (
            <Link
              key={d.id}
              href={`${base}/flashcards/${d.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-card-hover"
            >
              <div>
                <p className="font-medium">{d.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {subjectLabel(d.subject)} · 共 {d.total} 张
                </p>
              </div>
              {d.due > 0 ? (
                <span className="rounded-full bg-accent-glow px-2.5 py-1 text-sm font-medium text-accent">
                  {d.due} 待复习
                </span>
              ) : (
                <span className="text-xs text-muted">已复习完</span>
              )}
            </Link>
          ))}
        </div>
      )}

      <details className="rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium">新建牌组</summary>
        <form action={createDeckAction} className="mt-3 flex flex-col gap-3">
          <input name="name" placeholder="牌组名称" className={inputClass} required />
          <select name="subject" className={inputClass} defaultValue="english">
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {SUBJECT_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            创建
          </button>
        </form>
      </details>
    </div>
  );
}
