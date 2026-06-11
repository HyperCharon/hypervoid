"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/auth";
import { createDeck, deleteDeck } from "@/db/study-decks";
import {
  createCard,
  importCards,
  recordReview,
  type ImportCard,
} from "@/db/study-cards";
import type { Sm2Rating } from "@/lib/study/sm2";
import { SUBJECTS, type Subject } from "@/lib/study/subjects";

function parseSubject(v: string): Subject {
  return (SUBJECTS as readonly string[]).includes(v) ? (v as Subject) : "english";
}

export async function createDeckAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("牌组名称不能为空");
  await createDeck({ name, subject: parseSubject(String(formData.get("subject") ?? "english")) });
  revalidatePath("/tools/flashcards");
}

export async function deleteDeckAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteDeck(id);
  revalidatePath("/tools/flashcards");
}

export async function createCardAction(formData: FormData) {
  await requireAdmin();
  const deckId = String(formData.get("deckId") ?? "");
  const front = String(formData.get("front") ?? "").trim();
  const back = String(formData.get("back") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!deckId || !front || !back) throw new Error("正反面不能为空");
  await createCard({ deckId, front, back, notes });
  revalidatePath(`/tools/flashcards/${deckId}`);
}

/** Imperatively called from the review UI; records one SM-2 rating. */
export async function reviewCardAction(cardId: string, rating: number) {
  await requireAdmin();
  if (![0, 1, 2, 3].includes(rating)) throw new Error("无效评分");
  await recordReview(cardId, rating as Sm2Rating);
}

function parseImport(raw: string): ImportCard[] {
  const trimmed = raw.trim();
  // JSON array: [{ "front": "...", "back": "...", "notes": "..." }]
  if (trimmed.startsWith("[")) {
    try {
      const arr = JSON.parse(trimmed) as unknown;
      if (Array.isArray(arr)) {
        return arr
          .map((o) => {
            const r = o as Record<string, unknown>;
            return {
              front: String(r.front ?? "").trim(),
              back: String(r.back ?? "").trim(),
              notes: r.notes != null ? String(r.notes).trim() : null,
            };
          })
          .filter((c) => c.front && c.back);
      }
    } catch {
      // fall through to delimited parsing
    }
  }
  // One card per line: front<TAB>back<TAB>notes (or comma-separated).
  return trimmed
    .split(/\r?\n/)
    .map((line) => {
      const cells = line.includes("\t") ? line.split("\t") : line.split(",");
      const [front, back, notes] = cells;
      return {
        front: (front ?? "").trim(),
        back: (back ?? "").trim(),
        notes: notes != null ? notes.trim() : null,
      };
    })
    .filter((c) => c.front && c.back);
}

export async function importCardsAction(formData: FormData) {
  await requireAdmin();
  const deckId = String(formData.get("deckId") ?? "");
  if (!deckId) throw new Error("缺少牌组");
  const raw = String(formData.get("cards") ?? "");
  const cards = parseImport(raw);
  if (cards.length === 0) throw new Error("未解析出任何卡片");
  await importCards(deckId, cards);
  revalidatePath(`/tools/flashcards/${deckId}`);
  revalidatePath("/tools/flashcards");
}
