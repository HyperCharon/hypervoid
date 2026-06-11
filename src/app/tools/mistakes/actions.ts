"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth";
import {
  createMistake,
  deleteMistake,
  recordMistakeReview,
} from "@/db/study-mistakes";
import { getToolsBase } from "@/lib/study/server";
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

export async function createMistakeAction(formData: FormData) {
  await requireAdmin();
  const subject = parseSubject(String(formData.get("subject") ?? ""));
  const topic = String(formData.get("topic") ?? "").trim() || null;
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const questionImage = String(formData.get("questionImage") ?? "").trim() || null;
  const questionText = String(formData.get("questionText") ?? "").trim() || null;
  const myAnswer = String(formData.get("myAnswer") ?? "").trim() || null;
  const correctAnswer = String(formData.get("correctAnswer") ?? "").trim() || null;
  const analysis = String(formData.get("analysis") ?? "").trim() || null;

  if (!questionImage && !questionText) {
    throw new Error("至少填写题目文字或上传题目图片");
  }

  await createMistake({
    subject,
    topic,
    tags,
    questionImage,
    questionText,
    myAnswer,
    correctAnswer,
    analysis,
  });
  revalidatePath("/tools/mistakes");
  revalidatePath("/tools");

  const base = await getToolsBase();
  redirect(`${base}/mistakes`);
}

export async function deleteMistakeAction(id: string) {
  await requireAdmin();
  if (!id) return;
  await deleteMistake(id);
  revalidatePath("/tools/mistakes");
  revalidatePath("/tools");
}

export async function reviewMistakeAction(id: string, gotIt: boolean) {
  await requireAdmin();
  await recordMistakeReview(id, gotIt);
  revalidatePath("/tools/mistakes");
  revalidatePath("/tools");
}
