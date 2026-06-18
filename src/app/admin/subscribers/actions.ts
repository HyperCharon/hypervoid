"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/auth";
import {
  deleteSubscriber,
  forceUnsubscribe,
  restoreSubscriber,
} from "@/db/subscribers";
import { recordAudit } from "@/lib/audit";

export async function deleteAction(id: string): Promise<void> {
  await requireAdmin();
  await deleteSubscriber(id);
  await recordAudit({ action: "subscriber.delete", targetType: "subscriber", targetId: id });
  revalidatePath("/admin/subscribers");
}

export async function unsubscribeAction(id: string): Promise<void> {
  await requireAdmin();
  await forceUnsubscribe(id);
  await recordAudit({ action: "subscriber.unsubscribe", targetType: "subscriber", targetId: id });
  revalidatePath("/admin/subscribers");
}

export async function restoreAction(id: string): Promise<void> {
  await requireAdmin();
  await restoreSubscriber(id);
  await recordAudit({ action: "subscriber.restore", targetType: "subscriber", targetId: id });
  revalidatePath("/admin/subscribers");
}
