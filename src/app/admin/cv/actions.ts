"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/auth";
import { saveCvData, setCvVisible } from "@/lib/cv-store";
import type { Bi, CvData } from "@/lib/cv-data";

export type CvActionState = { ok: boolean; error?: string; ts?: number };

function bi(form: FormData, key: string): Bi {
  return {
    zh: String(form.get(`${key}.zh`) ?? "").trim(),
    en: String(form.get(`${key}.en`) ?? "").trim(),
  };
}

// Identity + summary come from friendly fields; the repeating arrays come from
// one JSON textarea. We merge them back into a full CvData and persist as JSON.
export async function saveCvAction(
  _prev: CvActionState,
  form: FormData,
): Promise<CvActionState> {
  await requireAdmin();

  let arrays: Pick<CvData, "stats" | "skills" | "experience" | "projects" | "education" | "contacts">;
  try {
    const parsed = JSON.parse(String(form.get("arrays_json") ?? "{}"));
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("顶层必须是对象 { stats, skills, experience, projects, education, contacts }");
    }
    for (const k of ["stats", "skills", "experience", "projects", "education", "contacts"]) {
      if (!Array.isArray(parsed[k])) throw new Error(`字段 "${k}" 必须是数组`);
    }
    arrays = {
      stats: parsed.stats,
      skills: parsed.skills,
      experience: parsed.experience,
      projects: parsed.projects,
      education: parsed.education,
      contacts: parsed.contacts,
    };
  } catch (e) {
    return { ok: false, error: "数组 JSON 无效：" + (e instanceof Error ? e.message : String(e)) };
  }

  const data: CvData = {
    identity: {
      name: bi(form, "identity.name"),
      role: bi(form, "identity.role"),
      tagline: bi(form, "identity.tagline"),
      location: bi(form, "identity.location"),
      avatar: String(form.get("identity.avatar") ?? "/avatar.jpg").trim() || "/avatar.jpg",
      available: bi(form, "identity.available"),
    },
    summary: bi(form, "summary"),
    ...arrays,
  };

  try {
    await saveCvData(JSON.stringify(data));
  } catch (e) {
    return { ok: false, error: "保存失败：" + (e instanceof Error ? e.message : String(e)) };
  }

  revalidatePath("/cv");
  revalidatePath("/admin/cv");
  revalidatePath("/", "layout"); // header chip reads visibility/content via layout
  return { ok: true, ts: Date.now() };
}

export async function setCvVisibleAction(form: FormData) {
  await requireAdmin();
  const visible = String(form.get("cv_visible") ?? "") === "1";
  await setCvVisible(visible);
  revalidatePath("/cv");
  revalidatePath("/admin/cv");
  revalidatePath("/", "layout");
}
