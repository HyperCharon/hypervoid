"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/auth";
import { createRedirect, deleteRedirect } from "@/db/redirects";
import { recordAudit } from "@/lib/audit";

export async function createAction(form: FormData): Promise<void> {
  await requireAdmin();
  const code = String(form.get("code") ?? "").trim();
  const toUrl = String(form.get("toUrl") ?? "").trim();
  const note = String(form.get("note") ?? "").trim() || null;
  if (!code) throw new Error("短码不能为空");
  if (!toUrl) throw new Error("目标地址不能为空");
  if (!/^[\w-]+$/.test(code)) throw new Error("短码只能包含字母、数字、_、-");
  await createRedirect({ code, toUrl, note });
  await recordAudit({
    action: "redirect.create",
    targetType: "redirect",
    targetId: code,
    details: { toUrl },
  });
  revalidatePath("/admin/redirects");
}

export async function deleteAction(id: string): Promise<void> {
  await requireAdmin();
  await deleteRedirect(id);
  await recordAudit({
    action: "redirect.delete",
    targetType: "redirect",
    targetId: id,
  });
  revalidatePath("/admin/redirects");
}
