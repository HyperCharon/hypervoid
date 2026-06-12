"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/auth";
import {
  createQuestion,
  importQuestions,
  recordAttempt,
  type QuestionInput,
} from "@/db/study-questions";
import { SUBJECTS, type Subject } from "@/lib/study/subjects";

function parseSubject(v: string): Subject {
  return (SUBJECTS as readonly string[]).includes(v) ? (v as Subject) : "politics";
}

function parseTags(v: string): string[] {
  return v
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** "B" → single index 1; "BD" → multi bitmask. */
function parseAnswerLetters(
  s: string,
  optionCount: number,
): { answer: number; answerMask: number | null } {
  const idxs = [
    ...new Set(
      s
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .split("")
        .map((ch) => ch.charCodeAt(0) - 65),
    ),
  ]
    .filter((i) => i >= 0 && i < optionCount)
    .sort((a, b) => a - b);
  if (idxs.length === 0) throw new Error("答案无效（用 A/B/C/D 表示）");
  if (idxs.length === 1) return { answer: idxs[0], answerMask: null };
  return { answer: idxs[0], answerMask: idxs.reduce((m, i) => m | (1 << i), 0) };
}

export async function createQuestionAction(formData: FormData) {
  await requireAdmin();
  const subject = parseSubject(String(formData.get("subject") ?? ""));
  const stem = String(formData.get("stem") ?? "").trim();
  const options = String(formData.get("options") ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const explanation = String(formData.get("explanation") ?? "").trim() || null;
  const tags = parseTags(String(formData.get("tags") ?? ""));
  if (!stem) throw new Error("题干不能为空");
  if (options.length < 2) throw new Error("至少 2 个选项（每行一个）");
  const { answer, answerMask } = parseAnswerLetters(
    String(formData.get("answer") ?? ""),
    options.length,
  );
  await createQuestion({ subject, stem, options, answer, answerMask, explanation, tags });
  revalidatePath("/tools/quiz");
}

function parseQuestionImport(raw: string): QuestionInput[] {
  const arr = JSON.parse(raw.trim()) as unknown;
  if (!Array.isArray(arr)) throw new Error("应为 JSON 数组");
  return arr.map((o) => {
    const r = o as Record<string, unknown>;
    const stem = String(r.stem ?? "").trim();
    const options = Array.isArray(r.options)
      ? r.options.map((x) => String(x).trim()).filter(Boolean)
      : [];
    if (!stem || options.length < 2) throw new Error("每题需 stem 和 ≥2 个 options");
    let spec = "";
    if (typeof r.answer === "string") spec = r.answer;
    else if (typeof r.answer === "number")
      spec = String.fromCharCode(65 + r.answer);
    else if (Array.isArray(r.answers))
      spec = r.answers.map((i) => String.fromCharCode(65 + Number(i))).join("");
    const { answer, answerMask } = parseAnswerLetters(spec, options.length);
    return {
      subject: parseSubject(String(r.subject ?? "politics")),
      stem,
      options,
      answer,
      answerMask,
      explanation: r.explanation != null ? String(r.explanation).trim() : null,
      tags: Array.isArray(r.tags)
        ? r.tags.map((x) => String(x).trim()).filter(Boolean)
        : [],
    };
  });
}

export async function importQuestionsAction(formData: FormData) {
  await requireAdmin();
  let items: QuestionInput[];
  try {
    items = parseQuestionImport(String(formData.get("questions") ?? ""));
  } catch (e) {
    throw new Error("导入解析失败：" + (e as Error).message);
  }
  if (items.length === 0) throw new Error("未解析出题目");
  await importQuestions(items);
  revalidatePath("/tools/quiz");
}

export async function recordAttemptAction(
  questionId: string,
  chosen: number,
  chosenMask: number | null,
  correct: boolean,
) {
  await requireAdmin();
  await recordAttempt({ questionId, chosen, chosenMask, correct });
}

/**
 * Add a wrongly-answered quiz question to the mistake notebook. The caller
 * provides the question data so we don't need an extra DB round-trip.
 */
export async function addQuestionToMistakesAction(input: {
  stem: string;
  options: string[];
  answer: number;
  answerMask: number | null;
  explanation: string | null;
  chosen: number;
  subject: Subject;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireAdmin();

  const correctLetter = input.answerMask != null
    ? input.options
        .map((_, i) => ((input.answerMask as number) >> i) & 1 ? String.fromCharCode(65 + i) : "")
        .filter(Boolean)
        .join("")
    : String.fromCharCode(65 + input.answer);

  const chosenLetter = input.chosen >= 0 ? String.fromCharCode(65 + input.chosen) : "未选";

  try {
    const { createMistake } = await import("@/db/study-mistakes");
    const result = await createMistake({
      subject: input.subject,
      topic: null,
      tags: [],
      questionImage: null,
      questionText: input.stem + "\n\n" + input.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("\n"),
      myAnswer: chosenLetter,
      correctAnswer: correctLetter,
      analysis: input.explanation,
    });
    return { ok: true, id: result.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
