import Link from "next/link";
import { countQuestionsBySubject, getQuizStats } from "@/db/study-questions";
import { getToolsBase } from "@/lib/study/server";
import { SUBJECTS, SUBJECT_LABELS } from "@/lib/study/subjects";
import { createQuestionAction, importQuestionsAction } from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";

export default async function QuizPage() {
  const [base, counts, stats] = await Promise.all([
    getToolsBase(),
    countQuestionsBySubject(),
    getQuizStats(),
  ]);
  const countMap = new Map(counts.map((c) => [c.subject, c.count]));
  const accuracy =
    stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">刷题</h1>

      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-semibold tabular-nums">{stats.totalQuestions}</p>
          <p className="text-xs text-muted">题库</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-semibold tabular-nums">{stats.attempts}</p>
          <p className="text-xs text-muted">已答</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-semibold tabular-nums">
            {accuracy ?? "—"}
            {accuracy !== null && "%"}
          </p>
          <p className="text-xs text-muted">正确率</p>
        </div>
      </section>

      <Link
        href={`${base}/quiz/practice`}
        className="rounded-xl bg-primary py-3 text-center text-sm font-medium text-primary-foreground"
      >
        开始练习（全部，随机 10 题）
      </Link>

      <div className="grid grid-cols-2 gap-2">
        {SUBJECTS.map((s) => {
          const c = countMap.get(s) ?? 0;
          return (
            <Link
              key={s}
              href={`${base}/quiz/practice?subject=${s}`}
              className={`flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm ${
                c === 0 ? "pointer-events-none opacity-50" : "hover:bg-card-hover"
              }`}
            >
              <span>{SUBJECT_LABELS[s]}</span>
              <span className="text-muted">{c}</span>
            </Link>
          );
        })}
      </div>

      <details className="rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium">添加题目</summary>
        <form action={createQuestionAction} className="mt-3 flex flex-col gap-2">
          <select name="subject" defaultValue="politics" className={inputClass}>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {SUBJECT_LABELS[s]}
              </option>
            ))}
          </select>
          <textarea name="stem" rows={2} placeholder="题干" className={inputClass} required />
          <textarea
            name="options"
            rows={4}
            placeholder="选项，每行一个（A/B/C/D…）"
            className={inputClass}
            required
          />
          <input
            name="answer"
            placeholder="正确答案，如 B 或 BD（多选）"
            className={inputClass}
            required
          />
          <input name="tags" placeholder="标签，逗号分隔（可选）" className={inputClass} />
          <textarea name="explanation" rows={2} placeholder="解析（可选）" className={inputClass} />
          <button
            type="submit"
            className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            添加
          </button>
        </form>
      </details>

      <details className="rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium">批量导入</summary>
        <form action={importQuestionsAction} className="mt-3 flex flex-col gap-2">
          <textarea
            name="questions"
            rows={6}
            placeholder={
              'JSON 数组：\n[{"subject":"politics","stem":"…","options":["…","…"],"answer":"B","explanation":"…","tags":["…"]}]\nanswer 用字母，多选写 "BD"'
            }
            className={`${inputClass} font-mono text-xs`}
          />
          <button
            type="submit"
            className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            导入
          </button>
        </form>
      </details>
    </div>
  );
}
