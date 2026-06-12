import Link from "next/link";
import { Play, Plus } from "lucide-react";
import { listMistakes, getDueMistakes } from "@/db/study-mistakes";
import { getToolsBase } from "@/lib/study/server";
import { dayKey } from "@/lib/study/dates";
import { SUBJECTS, SUBJECT_LABELS, type Subject } from "@/lib/study/subjects";
import { MistakeCard } from "@/components/tools/MistakeCard";

export const dynamic = "force-dynamic";

export default async function MistakesPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const sp = await searchParams;
  const subject = (SUBJECTS as readonly string[]).includes(sp.subject ?? "")
    ? (sp.subject as Subject)
    : undefined;

  const [base, mistakes] = await Promise.all([
    getToolsBase(),
    listMistakes(subject ? { subject } : undefined),
  ]);

  const now = new Date();
  const items = mistakes
    .map((m) => ({
      id: m.id,
      subject: m.subject,
      topic: m.topic,
      tags: m.tags,
      questionImage: m.questionImage,
      questionText: m.questionText,
      myAnswer: m.myAnswer,
      correctAnswer: m.correctAnswer,
      analysis: m.analysis,
      box: m.box,
      mastered: m.mastered,
      due: !m.mastered && new Date(m.nextReviewAt) <= now,
      nextReview: dayKey(new Date(m.nextReviewAt)),
    }))
    .sort((a, b) => Number(b.due) - Number(a.due));

  const dueCount = items.filter((i) => i.due).length;

  const chips = [
    { key: "all", label: "全部", href: `${base}/mistakes`, active: !subject },
    ...SUBJECTS.map((s) => ({
      key: s,
      label: SUBJECT_LABELS[s],
      href: `${base}/mistakes?subject=${s}`,
      active: subject === s,
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">错题本</h1>
        <Link
          href={`${base}/mistakes/new`}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" aria-hidden /> 新增
        </Link>
      </div>

      {dueCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-accent">{dueCount} 道待复习</p>
          <Link
            href={`${base}/mistakes/review`}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          >
            <Play className="h-3.5 w-3.5" aria-hidden /> 开始复习
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <Link
            key={c.key}
            href={c.href}
            className={`rounded-full px-3 py-1 text-sm ${
              c.active
                ? "bg-accent text-primary-foreground"
                : "border border-border bg-card text-muted"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted">还没有错题。点「新增」拍照记录第一道。</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((m) => (
            <MistakeCard key={m.id} m={m} base={base} />
          ))}
        </div>
      )}
    </div>
  );
}
