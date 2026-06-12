"use client";

import { useRef, useState } from "react";
import { ImagePlus, Sparkles } from "lucide-react";
import { createMistakeAction, ocrMistakeAction } from "@/app/tools/mistakes/actions";
import { SUBJECTS, SUBJECT_LABELS } from "@/lib/study/subjects";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";

export function MistakeForm() {
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Form field values (controlled so AI can pre-fill them)
  const [questionText, setQuestionText] = useState("");
  const [optionsText, setOptionsText] = useState("");
  const [myAnswer, setMyAnswer] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [analysis, setAnalysis] = useState("");

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

  async function runOcr() {
    if (!imageUrl) return;
    setErr("");
    setOcrLoading(true);
    try {
      const result = await ocrMistakeAction(imageUrl);
      if (result.ok) {
        const d = result.data;
        if (d.questionText) setQuestionText(d.questionText);
        if (d.options.length > 0) setOptionsText(d.options.join("\n"));
        if (d.correctAnswer) setCorrectAnswer(d.correctAnswer);
      } else {
        setErr(result.error);
      }
    } catch {
      setErr("AI 识别失败");
    } finally {
      setOcrLoading(false);
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

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-card-hover"
        >
          <ImagePlus className="h-4 w-4" aria-hidden />
          {imageUrl ? "重拍" : "拍照"}
        </button>
        {imageUrl && (
          <button
            type="button"
            onClick={runOcr}
            disabled={ocrLoading}
            className="flex items-center gap-2 rounded-lg border border-accent/40 bg-card px-3 py-2 text-sm text-accent hover:bg-card-hover disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {ocrLoading ? "识别中…" : "AI 识别"}
          </button>
        )}
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
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
      />
      <textarea
        name="options"
        rows={3}
        placeholder="选项（每行一个，可选）"
        className={inputClass}
        value={optionsText}
        onChange={(e) => setOptionsText(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          name="myAnswer"
          placeholder="我的答案"
          className={inputClass}
          value={myAnswer}
          onChange={(e) => setMyAnswer(e.target.value)}
        />
        <input
          name="correctAnswer"
          placeholder="正确答案"
          className={inputClass}
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
        />
      </div>
      <textarea
        name="analysis"
        rows={3}
        placeholder="解析 / 错因"
        className={inputClass}
        value={analysis}
        onChange={(e) => setAnalysis(e.target.value)}
      />

      <button
        type="submit"
        disabled={uploading || ocrLoading}
        className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        保存
      </button>
    </form>
  );
}
