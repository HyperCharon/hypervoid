"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { motion } from "motion/react";
import { Check, NotebookPen, X } from "lucide-react";
import { recordAttemptAction, addQuestionToMistakesAction } from "@/app/tools/quiz/actions";
import type { Subject } from "@/lib/study/subjects";

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
  subject,
}: {
  questions: Question[];
  base: string;
  subject: Subject;
}) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [addedToMistakes, setAddedToMistakes] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const q = questions[idx];

  // Keyboard shortcuts: A-D=select, Space=submit/next
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!submitted) submit();
        else next();
        return;
      }

      if (!submitted && q) {
        const letterIdx = "abcdefgh".indexOf(e.key.toLowerCase());
        if (letterIdx >= 0 && letterIdx < q.options.length) {
          toggle(letterIdx);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [submitted, q, selected],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

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
    const isCorrect = multi
      ? chosenMask === q.answerMask
      : selected[0] === q.answer;
    const chosen = selected[0] ?? -1;
    startTransition(async () => {
      try {
        await recordAttemptAction(q.id, chosen, chosenMask, isCorrect);
      } catch {
        // best-effort
      }
    });
    if (isCorrect) setScore((s) => s + 1);
    setCorrect(isCorrect);
    setSubmitted(true);
  }

  function addToMistakes() {
    if (!q) return;
    const chosen = selected[0] ?? -1;
    startTransition(async () => {
      try {
        await addQuestionToMistakesAction({
          stem: q.stem,
          options: q.options,
          answer: q.answer,
          answerMask: q.answerMask,
          explanation: q.explanation,
          chosen,
          subject,
        });
        setAddedToMistakes((prev) => new Set(prev).add(q.id));
      } catch {
        // best-effort
      }
    });
  }

  function next() {
    setIdx((i) => i + 1);
    setSelected([]);
    setSubmitted(false);
    setCorrect(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between text-sm text-muted">
        <span>
          {idx + 1} / {questions.length}
        </span>
        {multi && <span className="text-accent">多选</span>}
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-background">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
        />
      </div>

      <p className="whitespace-pre-wrap text-base font-medium">{q.stem}</p>

      <div className="flex flex-col gap-2">
        {q.options.map((opt, i) => {
          const sel = selected.includes(i);
          const correct = submitted && isCorrectOption(i);
          const wrong = submitted && sel && !isCorrectOption(i);

          let cls = "border-border hover:border-border hover:bg-card-hover";
          if (submitted) {
            if (correct) cls = "border-accent/60 bg-accent-glow";
            else if (wrong) cls = "border-[var(--danger)]/50 bg-[var(--danger)]/10";
            else cls = "border-border opacity-50";
          } else if (sel) {
            cls = "border-accent bg-accent-glow/50";
          }

          return (
            <motion.button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              disabled={submitted}
              animate={submitted && correct ? { scale: [1, 1.02, 1] } : submitted && wrong ? { x: [0, -4, 4, -4, 0] } : {}}
              transition={{ duration: 0.3 }}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${cls}`}
            >
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                correct ? "bg-accent text-primary-foreground" :
                wrong ? "bg-[var(--danger)]/20 text-[var(--danger)]" :
                sel ? "bg-accent text-primary-foreground" :
                "bg-background text-muted"
              }`}>
                {correct ? <Check className="h-3 w-3" /> : wrong ? <X className="h-3 w-3" /> : LETTERS[i]}
              </span>
              <span className="whitespace-pre-wrap">{opt}</span>
            </motion.button>
          );
        })}
      </div>

      {submitted && q.explanation && (
        <div className="rounded-xl border border-border bg-card p-3 text-sm">
          <span className="text-muted">解析：</span>
          <span className="whitespace-pre-wrap">{q.explanation}</span>
        </div>
      )}

      {submitted && !correct && !addedToMistakes.has(q.id) && (
        <button
          type="button"
          onClick={addToMistakes}
          className="flex items-center justify-center gap-2 rounded-xl border border-accent/40 py-2.5 text-sm text-accent"
        >
          <NotebookPen className="h-4 w-4" aria-hidden /> 加入错题本
        </button>
      )}
      {submitted && addedToMistakes.has(q.id) && (
        <p className="text-center text-xs text-accent">已加入错题本</p>
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
