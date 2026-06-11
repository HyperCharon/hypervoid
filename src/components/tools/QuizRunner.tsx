"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { recordAttemptAction } from "@/app/tools/quiz/actions";

type Question = {
  id: string;
  stem: string;
  options: string[];
  answer: number;
  answerMask: number | null;
  explanation: string | null;
};

const LETTERS = "ABCDEFGH";

export function QuizRunner({
  questions,
  base,
}: {
  questions: Question[];
  base: string;
}) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [, startTransition] = useTransition();
  const q = questions[idx];

  if (!q) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-16 text-center">
        <p className="text-lg font-medium">练习完成</p>
        <p className="text-sm text-muted">
          {score} / {questions.length} 正确
        </p>
        <Link
          href={`${base}/quiz`}
          className="mt-2 rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
        >
          返回
        </Link>
      </div>
    );
  }

  const multi = q.answerMask != null;

  function toggle(i: number) {
    if (submitted) return;
    setSelected((sel) =>
      multi
        ? sel.includes(i)
          ? sel.filter((x) => x !== i)
          : [...sel, i]
        : [i],
    );
  }

  function isCorrectOption(i: number): boolean {
    if (multi) return (((q.answerMask as number) >> i) & 1) === 1;
    return i === q.answer;
  }

  function submit() {
    if (selected.length === 0 || submitted) return;
    const chosenMask = multi
      ? selected.reduce((m, i) => m | (1 << i), 0)
      : null;
    const correct = multi
      ? chosenMask === q.answerMask
      : selected[0] === q.answer;
    const chosen = selected[0] ?? -1;
    startTransition(async () => {
      try {
        await recordAttemptAction(q.id, chosen, chosenMask, correct);
      } catch {
        // best-effort
      }
    });
    if (correct) setScore((s) => s + 1);
    setSubmitted(true);
  }

  function next() {
    setIdx((i) => i + 1);
    setSelected([]);
    setSubmitted(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between text-sm text-muted">
        <span>
          {idx + 1} / {questions.length}
        </span>
        {multi && <span className="text-accent">多选</span>}
      </div>

      <p className="whitespace-pre-wrap text-base font-medium">{q.stem}</p>

      <div className="flex flex-col gap-2">
        {q.options.map((opt, i) => {
          const sel = selected.includes(i);
          let cls = "border-border";
          if (submitted) {
            if (isCorrectOption(i)) cls = "border-accent/60 bg-accent-glow";
            else if (sel) cls = "border-[var(--danger)]/50 bg-[var(--danger)]/10";
          } else if (sel) {
            cls = "border-accent";
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              disabled={submitted}
              className={`flex gap-2 rounded-xl border p-3 text-left text-sm ${cls}`}
            >
              <span className="font-semibold text-muted">{LETTERS[i]}</span>
              <span className="whitespace-pre-wrap">{opt}</span>
            </button>
          );
        })}
      </div>

      {submitted && q.explanation && (
        <div className="rounded-xl border border-border bg-card p-3 text-sm">
          <span className="text-muted">解析：</span>
          <span className="whitespace-pre-wrap">{q.explanation}</span>
        </div>
      )}

      {!submitted ? (
        <button
          type="button"
          onClick={submit}
          disabled={selected.length === 0}
          className="rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          提交
        </button>
      ) : (
        <button
          type="button"
          onClick={next}
          className="rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground"
        >
          {idx + 1 < questions.length ? "下一题" : "完成"}
        </button>
      )}
    </div>
  );
}
