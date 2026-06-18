"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/auth";
import { deleteBlob } from "@/lib/blob";
import { recordAudit } from "@/lib/audit";

export async function deleteBlobAction(url: string): Promise<void> {
  await requireAdmin();
  await deleteBlob(url);
  await recordAudit({ action: "media.delete", targetType: "blob", targetId: url });
  revalidatePath("/admin/media");
}
