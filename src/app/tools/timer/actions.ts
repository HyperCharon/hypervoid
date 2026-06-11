"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/auth";
import { createSession } from "@/db/study-sessions";
import { SUBJECTS, type Subject } from "@/lib/study/subjects";

function parseSubject(v: string): Subject {
  return (SUBJECTS as readonly string[]).includes(v) ? (v as Subject) : "english";
}

/** Persist a completed timer session. Called from the Pomodoro UI. */
export async function logSessionAction(
  subject: string,
  durationSec: number,
  note?: string,
) {
  await requireAdmin();
  const sec = Math.max(0, Math.floor(durationSec));
  if (sec < 30) return; // ignore trivially short sessions
  await createSession({
    subject: parseSubject(subject),
    durationSec: sec,
    note: note?.trim() || null,
  });
  revalidatePath("/tools/timer");
  revalidatePath("/tools");
}

/** Manually log a past study block (minutes). */
export async function logManualSessionAction(formData: FormData) {
  await requireAdmin();
  const subject = parseSubject(String(formData.get("subject") ?? ""));
  const minutes = Number(formData.get("minutes") ?? 0);
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!(minutes > 0)) throw new Error("分钟数无效");
  await createSession({
    subject,
    durationSec: Math.round(minutes * 60),
    note,
  });
  revalidatePath("/tools/timer");
  revalidatePath("/tools");
}
