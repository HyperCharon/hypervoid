import Link from "next/link";
import { getDueMistakes } from "@/db/study-mistakes";
import { getToolsBase } from "@/lib/study/server";
import { MistakeSwipe } from "@/components/tools/MistakeSwipe";

export const dynamic = "force-dynamic";

export default async function MistakeReviewPage() {
  const [base, due] = await Promise.all([getToolsBase(), getDueMistakes()]);

  const items = due.map((m) => ({
    id: m.id,
    questionImage: m.questionImage,
    questionText: m.questionText,
    myAnswer: m.myAnswer,
    correctAnswer: m.correctAnswer,
    analysis: m.analysis,
  }));

  return (
    <div className="flex flex-col gap-4">
      <Link href={`${base}/mistakes`} className="text-sm text-muted">
        ← 错题本
      </Link>
      {items.length > 0 ? (
        <MistakeSwipe mistakes={items} base={base} />
      ) : (
        <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted">
          暂无待复习错题。
        </p>
      )}
    </div>
  );
}
