"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/auth";
import { deleteWebmention, setWebmentionHidden } from "@/lib/webmentions";
import { recordAudit } from "@/lib/audit";

export async function toggleHiddenAction(
  id: string,
  hidden: boolean,
): Promise<void> {
  await requireAdmin();
  await setWebmentionHidden(id, hidden);
  await recordAudit({
    action: hidden ? "webmention.hide" : "webmention.show",
    targetType: "webmention",
    targetId: id,
  });
  revalidatePath("/admin/webmentions");
}

export async function deleteAction(id: string): Promise<void> {
  await requireAdmin();
  await deleteWebmention(id);
  await recordAudit({
    action: "webmention.delete",
    targetType: "webmention",
    targetId: id,
  });
  revalidatePath("/admin/webmentions");
}
