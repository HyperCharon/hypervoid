"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown, Pencil, Trash2, X } from "lucide-react";
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

export function MistakeCard({ m, base }: { m: MistakeView; base: string }) {
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

  const hasDetails = m.myAnswer || m.correctAnswer || m.analysis;

  return (
    <motion.div
      layout
      className={`rounded-xl border bg-card p-4 transition-colors ${
        m.mastered
          ? "border-accent/20 opacity-70"
          : m.due
            ? "border-accent/40"
            : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-accent-glow px-2 py-0.5 text-xs font-medium text-accent">
            {subjectLabel(m.subject)}
          </span>
          {m.topic && <span className="text-xs text-muted">{m.topic}</span>}
          {m.due && !m.mastered && (
            <span className="rounded-full bg-orange-400/10 px-1.5 py-0.5 text-[10px] font-medium text-orange-400">
              待复习
            </span>
          )}
          {m.mastered && (
            <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
              已掌握
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`${base}/mistakes/${m.id}/edit`}
            aria-label="编辑"
            className="rounded p-1 text-muted transition-colors hover:text-foreground"
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label="删除"
            className="rounded p-1 text-muted transition-colors hover:text-[var(--danger)]"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
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

      {hasDetails && (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mt-3 flex items-center gap-1 text-xs text-accent"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
              aria-hidden
            />
            {open ? "收起" : "查看答案与解析"}
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mt-2 flex flex-col gap-2 border-t border-border pt-2 text-sm">
                  {m.myAnswer && (
                    <p>
                      <span className="text-muted">我的答案：</span>
                      <span className="text-[var(--danger)]">{m.myAnswer}</span>
                    </p>
                  )}
                  {m.correctAnswer && (
                    <p>
                      <span className="text-muted">正确答案：</span>
                      <span className="text-accent">{m.correctAnswer}</span>
                    </p>
                  )}
                  {m.analysis && (
                    <p className="whitespace-pre-wrap">
                      <span className="text-muted">解析：</span>
                      {m.analysis}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
              className="flex items-center gap-1 rounded-lg border border-[var(--danger)]/40 px-3 py-1.5 text-xs text-[var(--danger)] transition-colors hover:bg-[var(--danger)]/10"
            >
              <X className="h-3.5 w-3.5" aria-hidden /> 没掌握
            </button>
            <button
              type="button"
              onClick={() => review(true)}
              disabled={pending}
              className="flex items-center gap-1 rounded-lg border border-accent/40 px-3 py-1.5 text-xs text-accent transition-colors hover:bg-accent/10"
            >
              <Check className="h-3.5 w-3.5" aria-hidden /> 掌握
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
