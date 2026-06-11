"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/auth";
import { updateStudySettings } from "@/db/study-settings";

export async function updateStudySettingsAction(formData: FormData) {
  await requireAdmin();
  const examDateStr = String(formData.get("examDate") ?? "").trim();
  const dailyNewCards = Number(formData.get("dailyNewCards") ?? 20);
  const dailyReviewCap = Number(formData.get("dailyReviewCap") ?? 200);

  await updateStudySettings({
    examDate: examDateStr ? new Date(examDateStr) : null,
    dailyNewCards: Number.isFinite(dailyNewCards) ? dailyNewCards : 20,
    dailyReviewCap: Number.isFinite(dailyReviewCap) ? dailyReviewCap : 200,
  });

  revalidatePath("/tools");
  revalidatePath("/tools/settings");
}
