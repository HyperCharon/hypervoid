"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { updateMistakeAction } from "@/app/tools/mistakes/actions";
import { SUBJECTS, SUBJECT_LABELS, type Subject } from "@/lib/study/subjects";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";

type Mistake = {
  id: string;
  subject: Subject;
  topic: string | null;
  tags: string[];
  questionImage: string | null;
  questionText: string | null;
  myAnswer: string | null;
  correctAnswer: string | null;
  analysis: string | null;
};

export function MistakeEditForm({ mistake, base }: { mistake: Mistake; base: string }) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState(mistake.questionImage ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    setErr("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) setImageUrl(data.url);
      else setErr(data.error ?? "上传失败");
    } catch {
      setErr("上传失败");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setErr("");
    try {
      await updateMistakeAction(mistake.id, formData);
      router.push(`${base}/mistakes`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="questionImage" value={imageUrl} />

      <select name="subject" defaultValue={mistake.subject} className={inputClass}>
        {SUBJECTS.map((s) => (
          <option key={s} value={s}>
            {SUBJECT_LABELS[s]}
          </option>
        ))}
      </select>

      <input
        name="topic"
        placeholder="知识点 / 章节（可选）"
        defaultValue={mistake.topic ?? ""}
        className={inputClass}
      />
      <input
        name="tags"
        placeholder="标签，逗号分隔（可选）"
        defaultValue={mistake.tags.join(", ")}
        className={inputClass}
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-card-hover"
        >
          <ImagePlus className="h-4 w-4" aria-hidden />
          {imageUrl ? "重拍" : "拍照"}
        </button>
        {uploading && <span className="text-sm text-muted">上传中…</span>}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFile}
          className="hidden"
        />
      </div>
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt="题目预览"
          className="max-h-64 w-full rounded-lg border border-border object-contain"
        />
      )}
      {err && <p className="text-sm text-[var(--danger)]">{err}</p>}

      <textarea
        name="questionText"
        rows={3}
        placeholder="题目文字"
        defaultValue={mistake.questionText ?? ""}
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          name="myAnswer"
          placeholder="我的答案"
          defaultValue={mistake.myAnswer ?? ""}
          className={inputClass}
        />
        <input
          name="correctAnswer"
          placeholder="正确答案"
          defaultValue={mistake.correctAnswer ?? ""}
          className={inputClass}
        />
      </div>
      <textarea
        name="analysis"
        rows={3}
        placeholder="解析 / 错因"
        defaultValue={mistake.analysis ?? ""}
        className={inputClass}
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={uploading || saving}
          className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {saving ? "保存中…" : "保存"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`${base}/mistakes`)}
          className="self-start rounded-lg border border-border px-4 py-2 text-sm text-muted"
        >
          取消
        </button>
      </div>
    </form>
  );
}
