"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/auth";
import {
  createResource,
  deleteResource,
  updateResource,
} from "@/db/resources";
import { recordAudit } from "@/lib/audit";

export async function createAction(form: FormData): Promise<void> {
  await requireAdmin();
  const title = String(form.get("title") ?? "").trim();
  const url = String(form.get("url") ?? "").trim();
  const description = String(form.get("description") ?? "").trim() || null;
  const category = String(form.get("category") ?? "").trim() || "其他";
  const icon = String(form.get("icon") ?? "").trim() || null;
  const sortOrder = Number(form.get("sortOrder") ?? 0) || 0;
  if (!title) throw new Error("标题不能为空");
  if (!url) throw new Error("地址不能为空");
  await createResource({ title, url, description, category, icon, sortOrder });
  await recordAudit({
    action: "resource.create",
    targetType: "resource",
    details: { title, url, category },
  });
  revalidatePath("/admin/resources");
  revalidatePath("/resources");
}

export async function updateAction(form: FormData): Promise<void> {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  if (!id) throw new Error("缺少 id");
  await updateResource(id, {
    title: String(form.get("title") ?? "").trim(),
    url: String(form.get("url") ?? "").trim(),
    description: String(form.get("description") ?? "").trim() || null,
    category: String(form.get("category") ?? "").trim() || "其他",
    icon: String(form.get("icon") ?? "").trim() || null,
    hidden: form.get("hidden") === "on",
    sortOrder: Number(form.get("sortOrder") ?? 0) || 0,
  });
  await recordAudit({
    action: "resource.update",
    targetType: "resource",
    targetId: id,
  });
  revalidatePath("/admin/resources");
  revalidatePath("/resources");
}

export async function deleteAction(id: string): Promise<void> {
  await requireAdmin();
  await deleteResource(id);
  await recordAudit({
    action: "resource.delete",
    targetType: "resource",
    targetId: id,
  });
  revalidatePath("/admin/resources");
  revalidatePath("/resources");
}
