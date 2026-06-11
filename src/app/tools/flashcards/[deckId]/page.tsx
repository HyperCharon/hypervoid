import Link from "next/link";
import { notFound } from "next/navigation";
import { getDeck } from "@/db/study-decks";
import { getDueCards } from "@/db/study-cards";
import { getToolsBase } from "@/lib/study/server";
import { subjectLabel } from "@/lib/study/subjects";
import { FlashcardSwipe } from "@/components/tools/FlashcardSwipe";
import { createCardAction, importCardsAction } from "../actions";

export const dynamic = "force-dynamic";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";

export default async function DeckReviewPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  const [base, deck] = await Promise.all([getToolsBase(), getDeck(deckId)]);
  if (!deck) notFound();

  const due = await getDueCards(deckId);
  const cards = due.map((c) => ({
    id: c.id,
    front: c.front,
    back: c.back,
    notes: c.notes,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link href={`${base}/flashcards`} className="text-sm text-muted">
          ← 牌组
        </Link>
        <h1 className="text-base font-semibold">{deck.name}</h1>
        <span className="text-xs text-muted">{subjectLabel(deck.subject)}</span>
      </div>

      {cards.length > 0 ? (
        <FlashcardSwipe cards={cards} base={base} />
      ) : (
        <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted">
          暂无待复习卡片。添加一些卡片，或稍后再来。
        </p>
      )}

      <details className="rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium">添加卡片</summary>
        <form action={createCardAction} className="mt-3 flex flex-col gap-2">
          <input type="hidden" name="deckId" value={deckId} />
          <input name="front" placeholder="正面（单词）" className={inputClass} required />
          <input name="back" placeholder="背面（释义）" className={inputClass} required />
          <input name="notes" placeholder="例句 / 助记（可选）" className={inputClass} />
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
        <form action={importCardsAction} className="mt-3 flex flex-col gap-2">
          <input type="hidden" name="deckId" value={deckId} />
          <textarea
            name="cards"
            rows={6}
            placeholder={
              'JSON：[{"front":"…","back":"…","notes":"…"}]\n或每行：单词<Tab>释义<Tab>助记（也支持逗号分隔）'
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
