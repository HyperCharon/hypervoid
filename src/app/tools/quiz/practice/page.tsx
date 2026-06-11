import Link from "next/link";
import { getRandomQuestions } from "@/db/study-questions";
import { getToolsBase } from "@/lib/study/server";
import { SUBJECTS, type Subject } from "@/lib/study/subjects";
import { QuizRunner } from "@/components/tools/QuizRunner";

export const dynamic = "force-dynamic";

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const sp = await searchParams;
  const subject = (SUBJECTS as readonly string[]).includes(sp.subject ?? "")
    ? (sp.subject as Subject)
    : undefined;

  const [base, questions] = await Promise.all([
    getToolsBase(),
    getRandomQuestions({ subject, limit: 10 }),
  ]);

  const view = questions.map((q) => ({
    id: q.id,
    stem: q.stem,
    options: q.options,
    answer: q.answer,
    answerMask: q.answerMask,
    explanation: q.explanation,
  }));

  return (
    <div className="flex flex-col gap-4">
      <Link href={`${base}/quiz`} className="text-sm text-muted">
        ← 刷题
      </Link>
      {view.length > 0 ? (
        <QuizRunner questions={view} base={base} />
      ) : (
        <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted">
          该范围还没有题目，先去添加或批量导入。
        </p>
      )}
    </div>
  );
}
