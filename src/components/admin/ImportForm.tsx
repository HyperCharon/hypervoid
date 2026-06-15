"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Trash2, Upload } from "lucide-react";

export function ImportForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; total: number; results: { slug: string; title: string; ok: boolean; error?: string }[] } | null>(null);

  const validFiles = useMemo(() => files.filter((f) => f.name.endsWith(".md") || f.name.endsWith(".markdown")), [files]);
  const onFiles = useCallback((list: FileList | null) => { if (!list) return; setFiles((prev) => [...prev, ...Array.from(list)].slice(0, 20)); }, []);
  const onDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); }, [onFiles]);

  const onSubmit = async () => {
    if (validFiles.length === 0) return;
    setImporting(true); setResult(null);
    const fd = new FormData();
    for (const f of validFiles) fd.append("files", f);
    try {
      const res = await fetch("/api/admin/import", { method: "POST", body: fd });
      const data = await res.json();
      setResult(data);
      if (data.imported > 0) router.refresh();
    } catch {
      setResult({ imported: 0, total: validFiles.length, results: [] });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={"border-2 border-dashed p-8 text-center transition " + (dragOver ? "border-accent/55 bg-accent/10" : "border-border bg-card/50")}
      >
        <FileUp className="mx-auto h-8 w-8 text-muted" aria-hidden />
        <p className="mt-3 text-sm text-muted">拖拽 .md 文件到此处，或点击选择</p>
        <input ref={inputRef} type="file" accept=".md,.markdown,.txt" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
        <button type="button" className="hv-action mt-3 px-4 py-1.5 text-sm font-medium" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" aria-hidden />
          选择文件
        </button>
      </div>

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">{validFiles.length}/{files.length} 个 .md 文件</p>
            <div className="flex gap-2">
              <button type="button" className="hv-action min-h-8 px-3 text-xs" onClick={() => setFiles([])}>
                <Trash2 className="h-3.5 w-3.5" aria-hidden /> 清空
              </button>
              <button type="button" disabled={importing || validFiles.length === 0} className="hv-action min-h-8 px-4 text-sm font-medium disabled:opacity-50" onClick={onSubmit}>
                {importing ? "导入中..." : "导入 " + validFiles.length + " 篇"}
              </button>
            </div>
          </div>
          <ul className="max-h-48 space-y-1 overflow-auto border border-border bg-card p-3 text-sm">
            {files.map((f, i) => <li key={i} className="truncate text-muted">{f.name} <span className="text-xs">({(f.size / 1024).toFixed(0)}KB)</span></li>)}
          </ul>
        </div>
      )}

      {result && (
        <div className="hv-panel p-4">
          <p className="font-semibold text-foreground">导入完成：{result.imported}/{result.total} 篇成功</p>
          {result.results.length > 0 && (
            <ul className="mt-2 max-h-64 space-y-1 overflow-auto text-sm">
              {result.results.map((r) => <li key={r.slug} className={r.ok ? "text-emerald-300" : "text-red-300"}>{r.ok ? "✓" : "✗"} {r.title} — {r.ok ? r.slug : r.error}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
