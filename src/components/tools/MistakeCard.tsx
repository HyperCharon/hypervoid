"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, X } from "lucide-react";
import {
  deleteMistakeAction,
  reviewMistakeAction,
} from "@/app/tools/mistakes/actions";
import { subjectLabel, type Subject } from "@/lib/study/subjects";

export type MistakeView = {
  id: string;
  subject: Subject;
  topic: string | null;
  tags: string[];
  questionImage: string | null;
  questionText: string | null;
  myAnswer: string | null;
  correctAnswer: string | null;
  analysis: string | null;
  box: number;
  mastered: boolean;
  due: boolean;
  nextReview: string;
};

export function MistakeCard({ m }: { m: MistakeView }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function review(gotIt: boolean) {
    startTransition(async () => {
      try {
        await reviewMistakeAction(m.id, gotIt);
        router.refresh();
      } catch {
        // best-effort
      }
    });
  }

  function remove() {
    if (!window.confirm("删除这道错题？")) return;
    startTransition(async () => {
      try {
        await deleteMistakeAction(m.id);
        router.refresh();
      } catch {
        // best-effort
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-accent-glow px-2 py-0.5 text-xs font-medium text-accent">
            {subjectLabel(m.subject)}
          </span>
          {m.topic && <span className="text-xs text-muted">{m.topic}</span>}
        </div>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          aria-label="删除"
          className="text-muted hover:text-[var(--danger)]"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {m.questionImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={m.questionImage}
          alt="题目"
          className="mt-3 max-h-72 w-full rounded-lg border border-border object-contain"
        />
      )}
      {m.questionText && (
        <p className="mt-3 whitespace-pre-wrap text-sm">{m.questionText}</p>
      )}

      {m.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {m.tags.map((t) => (
            <span
              key={t}
              className="rounded bg-background px-1.5 py-0.5 text-xs text-muted"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {(m.myAnswer || m.correctAnswer || m.analysis) && (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mt-3 text-xs text-accent"
          >
            {open ? "收起" : "查看答案与解析"}
          </button>
          {open && (
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-2 text-sm">
              {m.myAnswer && (
                <p>
                  <span className="text-muted">我的答案：</span>
                  {m.myAnswer}
                </p>
              )}
              {m.correctAnswer && (
                <p>
                  <span className="text-muted">正确答案：</span>
                  {m.correctAnswer}
                </p>
              )}
              {m.analysis && (
                <p className="whitespace-pre-wrap">
                  <span className="text-muted">解析：</span>
                  {m.analysis}
                </p>
              )}
            </div>
          )}
        </>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted">
          {m.mastered ? "已掌握" : `下次复习 ${m.nextReview}`}
          <span className="ml-2">第 {m.box} 盒</span>
        </span>
        {!m.mastered && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => review(false)}
              disabled={pending}
              className="flex items-center gap-1 rounded-lg border border-[var(--danger)]/40 px-3 py-1.5 text-xs text-[var(--danger)]"
            >
              <X className="h-3.5 w-3.5" aria-hidden /> 没掌握
            </button>
            <button
              type="button"
              onClick={() => review(true)}
              disabled={pending}
              className="flex items-center gap-1 rounded-lg border border-accent/40 px-3 py-1.5 text-xs text-accent"
            >
              <Check className="h-3.5 w-3.5" aria-hidden /> 掌握
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
