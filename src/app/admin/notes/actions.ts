"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/auth";
import {
  createAnnouncement,
  deleteAnnouncement,
  toggleAnnouncement,
  updateAnnouncement,
  type AnnouncementInput,
} from "@/db/announcements";
import { recordAudit } from "@/lib/audit";

function parseDate(s: string): Date | null {
  const trimmed = s.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

function readForm(form: FormData): AnnouncementInput {
  const slot = String(form.get("slot") ?? "top") as AnnouncementInput["slot"];
  const message = String(form.get("message") ?? "").trim();
  if (!message) throw new Error("公告正文不能为空");
  return {
    slot,
    message,
    link: String(form.get("link") ?? "").trim() || null,
    linkText: String(form.get("linkText") ?? "").trim() || null,
    startsAt: parseDate(String(form.get("startsAt") ?? "")),
    endsAt: parseDate(String(form.get("endsAt") ?? "")),
    priority: Number(form.get("priority") ?? 0) || 0,
    active: form.get("active") === "on",
  };
}

export async function createAction(form: FormData): Promise<void> {
  await requireAdmin();
  const data = readForm(form);
  await createAnnouncement(data);
  await recordAudit({
    action: "announcement.create",
    targetType: "announcement",
    details: { slot: data.slot, priority: data.priority },
  });
  revalidatePath("/admin/notes");
  revalidatePath("/", "layout");
}

export async function updateAction(id: string, form: FormData): Promise<void> {
  await requireAdmin();
  const data = readForm(form);
  await updateAnnouncement(id, data);
  await recordAudit({
    action: "announcement.update",
    targetType: "announcement",
    targetId: id,
    details: { slot: data.slot, active: data.active },
  });
  revalidatePath("/admin/notes");
  revalidatePath("/", "layout");
}

export async function deleteAction(id: string): Promise<void> {
  await requireAdmin();
  await deleteAnnouncement(id);
  await recordAudit({
    action: "announcement.delete",
    targetType: "announcement",
    targetId: id,
  });
  revalidatePath("/admin/notes");
  revalidatePath("/", "layout");
}

export async function toggleAction(id: string): Promise<void> {
  await requireAdmin();
  await toggleAnnouncement(id);
  await recordAudit({
    action: "announcement.toggle",
    targetType: "announcement",
    targetId: id,
  });
  revalidatePath("/admin/notes");
  revalidatePath("/", "layout");
}
