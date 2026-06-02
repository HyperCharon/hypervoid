"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/auth";
import { createQuickNote, deleteQuickNote } from "@/db/quick-notes";

export async function addQuickNoteAction(formData: FormData) {
  await requireAdmin();
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;
  await createQuickNote(content);
  revalidatePath("/diary");
}

export async function deleteQuickNoteAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteQuickNote(id);
  revalidatePath("/diary");
}
