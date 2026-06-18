"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/auth";
import { setAiModel } from "@/lib/ai-config";
import {
  deleteCustomModel,
  upsertCustomModel,
  customDisplayId,
} from "@/lib/ai-custom-models";
import { setProviderQuota } from "@/lib/ai-quota";
import { recordAudit } from "@/lib/audit";

export async function updateModelAction(form: FormData): Promise<void> {
  await requireAdmin();
  const model = String(form.get("model") ?? "").trim();
  if (!model) throw new Error("缺少 model");
  await setAiModel(model);
  await recordAudit({
    action: "ai.model.update",
    targetType: "ai",
    details: { model },
  });
  revalidatePath("/admin/ai");
}

export async function updateQuotaAction(form: FormData): Promise<void> {
  await requireAdmin();
  const providers = String(form.get("providers") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const p of providers) {
    const raw = form.get(`quota.${p}`);
    const n = raw == null ? 0 : Number(String(raw).replace(/[, _]/g, ""));
    if (!Number.isFinite(n) || n < 0)
      throw new Error(`provider ${p}: 限额必须是 ≥0 的整数`);
    await setProviderQuota(p, n);
  }
  await recordAudit({
    action: "ai.quota.update",
    targetType: "ai",
    details: { providers },
  });
  revalidatePath("/admin/ai");
}

export async function saveCustomModelAction(form: FormData): Promise<void> {
  await requireAdmin();
  const id = String(form.get("id") ?? "").trim();
  const label = String(form.get("label") ?? "").trim();
  const hint = String(form.get("hint") ?? "").trim();
  const protocol = String(form.get("protocol") ?? "openai").trim() as
    | "openai"
    | "anthropic";
  const baseUrl = String(form.get("baseUrl") ?? "").trim();
  const upstreamId = String(form.get("upstreamId") ?? "").trim();
  const apiKey = String(form.get("apiKey") ?? "").trim();
  const extraHeadersRaw = String(form.get("extraHeaders") ?? "").trim();

  let extraHeaders: Record<string, string> = {};
  if (extraHeadersRaw) {
    try {
      const parsed = JSON.parse(extraHeadersRaw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const collected: Record<string, string> = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === "string") collected[k] = v;
        }
        extraHeaders = collected;
      }
    } catch {
      throw new Error("extraHeaders 必须是合法 JSON 对象");
    }
  }

  await upsertCustomModel({
    id,
    label,
    hint: hint || undefined,
    protocol,
    baseUrl,
    upstreamId,
    apiKey,
    extraHeaders,
  });
  await recordAudit({
    action: "ai.custom.save",
    targetType: "ai",
    targetId: id,
    details: { label, protocol, baseUrl, upstreamId },
  });
  revalidatePath("/admin/ai");
}

export async function deleteCustomModelAction(form: FormData): Promise<void> {
  await requireAdmin();
  const id = String(form.get("id") ?? "").trim();
  if (!id) throw new Error("缺少 id");
  await deleteCustomModel(id);
  await recordAudit({
    action: "ai.custom.delete",
    targetType: "ai",
    targetId: id,
    details: { displayId: customDisplayId(id) },
  });
  revalidatePath("/admin/ai");
}
