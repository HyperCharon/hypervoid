"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { createMistakeAction } from "@/app/tools/mistakes/actions";
import { SUBJECTS, SUBJECT_LABELS } from "@/lib/study/subjects";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";

export function MistakeForm() {
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
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

  return (
    <form action={createMistakeAction} className="flex flex-col gap-3">
      <input type="hidden" name="questionImage" value={imageUrl} />

      <select name="subject" defaultValue="politics" className={inputClass}>
        {SUBJECTS.map((s) => (
          <option key={s} value={s}>
            {SUBJECT_LABELS[s]}
          </option>
        ))}
      </select>

      <input name="topic" placeholder="知识点 / 章节（可选）" className={inputClass} />
      <input name="tags" placeholder="标签，逗号分隔（可选）" className={inputClass} />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-card-hover"
        >
          <ImagePlus className="h-4 w-4" aria-hidden />
          {imageUrl ? "重新拍照 / 选图" : "拍照 / 选图"}
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
        rows={2}
        placeholder="题目文字（可选，可与图片二选一）"
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-2">
        <input name="myAnswer" placeholder="我的答案" className={inputClass} />
        <input name="correctAnswer" placeholder="正确答案" className={inputClass} />
      </div>
      <textarea
        name="analysis"
        rows={3}
        placeholder="解析 / 错因"
        className={inputClass}
      />

      <button
        type="submit"
        disabled={uploading}
        className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        保存
      </button>
    </form>
  );
}
