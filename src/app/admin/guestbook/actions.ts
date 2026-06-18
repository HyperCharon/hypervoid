"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/auth";
import {
  deleteMessage,
  hideMessage,
  unhideMessage,
} from "@/db/guestbook";
import { recordAudit } from "@/lib/audit";

export async function hideAction(id: string): Promise<void> {
  await requireAdmin();
  await hideMessage(id);
  await recordAudit({ action: "guestbook.hide", targetType: "guestbook", targetId: id });
  revalidatePath("/admin/guestbook");
  revalidatePath("/guestbook");
}

export async function unhideAction(id: string): Promise<void> {
  await requireAdmin();
  await unhideMessage(id);
  await recordAudit({ action: "guestbook.unhide", targetType: "guestbook", targetId: id });
  revalidatePath("/admin/guestbook");
  revalidatePath("/guestbook");
}

export async function deleteAction(id: string): Promise<void> {
  await requireAdmin();
  await deleteMessage(id);
  await recordAudit({ action: "guestbook.delete", targetType: "guestbook", targetId: id });
  revalidatePath("/admin/guestbook");
  revalidatePath("/guestbook");
}
