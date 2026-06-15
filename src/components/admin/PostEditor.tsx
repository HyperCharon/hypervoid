"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { FileUp, ImagePlus, Pin, Sparkles, Trash2, Upload } from "lucide-react";
import { suggestTagsAction } from "@/app/admin/posts/actions";

export type PostEditorInitial = {
  slug: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string;
  cover: string;
  pinned: boolean;
  status: "draft" | "scheduled" | "published";
  visibility: "public" | "private";
  series: string;
  seriesOrder: string;
  publishAt: string;
};

const EMPTY: PostEditorInitial = {
  slug: "",
  title: "",
  description: "",
  content: "",
  category: "",
  tags: "",
  cover: "",
  pinned: false,
  status: "draft",
  visibility: "public",
  series: "",
  seriesOrder: "",
  publishAt: "",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function PostEditor({
  mode,
  initial = EMPTY,
  onSubmit,
  onDelete,
}: {
  mode: "new" | "edit";
  initial?: PostEditorInitial;
  onSubmit: (formData: FormData) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [state, setState] = useState<PostEditorInitial>(initial);
  const [pending, startTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [tagSuggesting, startTagSuggest] = useTransition();
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [tagSuggestError, setTagSuggestError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"cover" | "content" | null>(null);

  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const contentInputRef = useRef<HTMLInputElement | null>(null);
  const mdInputRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);
  const [mdDragOver, setMdDragOver] = useState(false);

  const update = <K extends keyof PostEditorInitial>(
    key: K,
    value: PostEditorInitial[K],
  ) => setState((s) => ({ ...s, [key]: value }));

  const handleTitleChange = (v: string) => {
    update("title", v);
    if (mode === "new" && !state.slug) {
      update("slug", slugify(v));
    }
  };

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status})`);
    return data.url as string;
  }

  const onCoverUpload = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setUploading("cover");
    try {
      const url = await uploadFile(file);
      update("cover", url);
    } catch (e) {
      setError(`上传封面失败：${(e as Error).message}`);
    } finally {
      setUploading(null);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const onContentImageUpload = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setUploading("content");
    try {
      const url = await uploadFile(file);
      const alt = file.name.replace(/\.[^.]+$/, "");
      const snippet = `![${alt}](${url})`;
      const ta = contentRef.current;
      if (ta) {
        const start = ta.selectionStart ?? state.content.length;
        const end = ta.selectionEnd ?? state.content.length;
        const next =
          state.content.slice(0, start) + snippet + state.content.slice(end);
        update("content", next);
        requestAnimationFrame(() => {
          ta.focus();
          const cursor = start + snippet.length;
          ta.setSelectionRange(cursor, cursor);
        });
      } else {
        update("content", state.content + "\n" + snippet);
      }
    } catch (e) {
      setError(`上传图片失败：${(e as Error).message}`);
    } finally {
      setUploading(null);
      if (contentInputRef.current) contentInputRef.current.value = "";
    }
  };

  /**
   * Minimal YAML frontmatter parser — handles the flat key-value pairs
   * commonly used in blog posts (title, description, date, tags, etc.).
   * Does NOT handle nested objects or multi-line values beyond arrays.
   */
  function parseFrontmatter(raw: string): {
    meta: Record<string, string>;
    body: string;
  } {
    const trimmed = raw.replace(/^﻿/, ""); // strip BOM
    const match = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) return { meta: {}, body: trimmed };

    const yamlBlock = match[1];
    const body = match[2];
    const meta: Record<string, string> = {};

    let currentKey = "";
    let collectingArray = false;
    let arrayLines: string[] = [];

    for (const line of yamlBlock.split("\n")) {
      // Continuation of a multi-line plain scalar
      if (currentKey && !collectingArray && line.startsWith("  ")) {
        meta[currentKey] = (meta[currentKey] ? meta[currentKey] + " " : "") + line.trim();
        continue;
      }
      // Array item
      if (collectingArray && /^\s*-\s+/.test(line)) {
        arrayLines.push(line.replace(/^\s*-\s+/, "").trim());
        continue;
      }
      // End of array collection
      if (collectingArray) {
        meta[currentKey] = arrayLines.join(", ");
        collectingArray = false;
        arrayLines = [];
      }

      const kvMatch = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
      if (!kvMatch) {
        currentKey = "";
        continue;
      }

      currentKey = kvMatch[1];
      let value = kvMatch[2].trim();

      // Strip surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // Check if this is an inline array: [a, b, c]
      if (value.startsWith("[") && value.endsWith("]")) {
        meta[currentKey] = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean)
          .join(", ");
        currentKey = "";
        continue;
      }

      // Empty value — might be followed by array items
      if (value === "" || value === null) {
        collectingArray = true;
        arrayLines = [];
        continue;
      }

      meta[currentKey] = value;
    }

    // Flush any trailing array
    if (collectingArray && arrayLines.length > 0) {
      meta[currentKey] = arrayLines.join(", ");
    }

    return { meta, body };
  }

  const onMdImport = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setImporting(true);
    try {
      const text = await file.text();
      const { meta, body } = parseFrontmatter(text);

      // Derive slug from filename if not in frontmatter
      const fileSlug = file.name
        .replace(/\.mdx?$/i, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const patch: Partial<PostEditorInitial> = {};

      if (meta.title) patch.title = meta.title;
      if (meta.description || meta.desc) patch.description = meta.description ?? meta.desc ?? "";
      if (meta.category) patch.category = meta.category;
      if (meta.tags) patch.tags = meta.tags;
      if (meta.cover || meta.cover_image || meta.thumbnail) patch.cover = meta.cover ?? meta.cover_image ?? meta.thumbnail ?? "";
      if (meta.series) patch.series = meta.series;
      if (meta.series_order || meta.seriesOrder) patch.seriesOrder = String(meta.series_order ?? meta.seriesOrder ?? "");
      if (meta.pinned) patch.pinned = meta.pinned === "true" || meta.pinned === "1";
      if (meta.status) patch.status = meta.status as PostEditorInitial["status"];
      if (meta.visibility) patch.visibility = meta.visibility as PostEditorInitial["visibility"];
      if (meta.publish_at || meta.publishAt) patch.publishAt = meta.publish_at ?? meta.publishAt ?? "";

      // Slug: prefer frontmatter, fallback to filename
      const derivedSlug = meta.slug ?? fileSlug;
      if (derivedSlug && (mode === "new" || !state.slug)) {
        patch.slug = derivedSlug;
      }

      // Content
      if (body.trim()) {
        patch.content = body;
      }

      setState((s) => ({ ...s, ...patch }));
    } catch (e) {
      setError(`导入 .md 失败：${(e as Error).message}`);
    } finally {
      setImporting(false);
      if (mdInputRef.current) mdInputRef.current.value = "";
    }
  };

  const onMdDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setMdDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && /\.(md|markdown|mdx)$/i.test(file.name)) {
      onMdImport(file);
    }
  };

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        await onSubmit(formData);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  const handleDelete = () => {
    if (!onDelete) return;
    if (!confirm(`确认删除「${state.title}」？此操作不可撤销。`)) return;
    startDeleteTransition(async () => {
      try {
        await onDelete();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <form action={handleSubmit} className="flex flex-col gap-6">
      {error ? (
        <div className="border border-red-400/35 bg-red-500/10 p-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {mode === "new" ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setMdDragOver(true); }}
          onDragLeave={() => setMdDragOver(false)}
          onDrop={onMdDrop}
          className={
            "flex items-center gap-3 rounded-lg border-2 border-dashed p-3 transition " +
            (mdDragOver
              ? "border-accent/55 bg-accent/10"
              : "border-border hover:border-accent/40")
          }
        >
          <FileUp className="h-5 w-5 shrink-0 text-muted" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">从 .md 文件导入</p>
            <p className="text-xs text-muted">拖拽 .md 文件到此处，或点击选择（自动解析 frontmatter 和正文）</p>
          </div>
          <button
            type="button"
            onClick={() => mdInputRef.current?.click()}
            disabled={importing}
            className="hv-action shrink-0 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            {importing ? "解析中…" : "选择文件"}
          </button>
          <input
            ref={mdInputRef}
            type="file"
            accept=".md,.markdown,.mdx"
            hidden
            onChange={(e) => onMdImport(e.currentTarget.files?.[0] ?? null)}
          />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="标题" required>
          <input
            name="title"
            type="text"
            required
            value={state.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field
          label="Slug (URL 路径)"
          required
          hint={
            mode === "edit"
              ? "已发布后不建议修改"
              : "纯 ASCII：小写字母、数字、短横线。例：hello-world、why-nextjs"
          }
        >
          <input
            name="slug"
            type="text"
            required
            readOnly={mode === "edit"}
            value={state.slug}
            onChange={(e) =>
              update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            className={`${inputClass} ${mode === "edit" ? "cursor-not-allowed text-muted-soft" : ""}`}
            pattern="[a-z0-9][a-z0-9-]*"
          />
        </Field>
      </div>

      <Field label="简介 (用于列表卡片、SEO description)">
        <textarea
          name="description"
          rows={2}
          value={state.description}
          onChange={(e) => update("description", e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="分类">
          <input
            name="category"
            type="text"
            value={state.category}
            onChange={(e) => update("category", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="标签 (逗号分隔)">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                name="tags"
                type="text"
                placeholder="Next.js, MDX, 杂谈"
                value={state.tags}
                onChange={(e) => update("tags", e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => {
                  setTagSuggestError(null);
                  startTagSuggest(async () => {
                    const res = await suggestTagsAction({
                      title: state.title,
                      content: state.content,
                    });
                    if ("error" in res) {
                      setTagSuggestError(res.error);
                      setSuggestedTags([]);
                    } else {
                      setSuggestedTags(res.tags);
                    }
                  });
                }}
                disabled={tagSuggesting || !state.content.trim()}
                className="hv-action shrink-0 px-3 py-2 text-xs disabled:opacity-50"
                title="让 Claude Haiku 读正文给标签建议"
              >
                {tagSuggesting ? "..." : (<><Sparkles className="h-3.5 w-3.5" aria-hidden /> AI 建议</>)}
              </button>
            </div>
            {tagSuggestError ? (
              <p className="text-xs text-red-400">{tagSuggestError}</p>
            ) : null}
            {suggestedTags.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-muted">建议：</span>
                {suggestedTags.map((t) => {
                  const current = state.tags
                    .split(/[,，]/)
                    .map((x) => x.trim())
                    .filter(Boolean);
                  const has = current.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        if (has) return;
                        const next = [...current, t].join(", ");
                        update("tags", next);
                      }}
                      disabled={has}
                      className={`inline-flex items-center gap-1 border px-2 py-0.5 transition ${
                        has
                          ? "border-border bg-card text-muted opacity-60"
                          : "border-border bg-card text-foreground hover:border-accent/40 hover:text-accent"
                      }`}
                      title={has ? "已加入" : "点击加入"}
                    >
                      {has ? "✓" : "+"} {t}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setSuggestedTags([])}
                  className="text-muted hover:text-foreground"
                  title="收起"
                >
                  ×
                </button>
              </div>
            ) : null}
          </div>
        </Field>
        <Field label="封面图 URL">
          <div className="flex gap-2">
            <input
              name="cover"
              type="url"
              value={state.cover}
              onChange={(e) => update("cover", e.target.value)}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploading !== null}
              className="hv-action shrink-0 px-3 py-2 text-sm disabled:opacity-50"
            >
              {uploading === "cover" ? "上传中…" : (<><Upload className="h-4 w-4" aria-hidden /> 上传</>)}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) =>
                onCoverUpload(e.currentTarget.files?.[0] ?? null)
              }
            />
          </div>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="状态">
          <select
            name="status"
            value={state.status}
            onChange={(e) =>
              update(
                "status",
                e.target.value as PostEditorInitial["status"],
              )
            }
            className={inputClass}
          >
            <option value="draft">草稿 (不公开)</option>
            <option value="scheduled">定时 (到点自动公开)</option>
            <option value="published">立即发布</option>
          </select>
        </Field>
        <Field
          label="可见性"
          hint="私密文章只有管理员能在线上看到，公开文章对所有访客可见"
        >
          <select
            name="visibility"
            value={state.visibility}
            onChange={(e) =>
              update(
                "visibility",
                e.target.value as PostEditorInitial["visibility"],
              )
            }
            className={inputClass}
          >
            <option value="public">公开</option>
            <option value="private">私密（仅管理员可见）</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {state.status === "scheduled" ? (
          <Field label="定时发布时间" required>
            <input
              name="publishAt"
              type="datetime-local"
              required
              value={state.publishAt}
              onChange={(e) => update("publishAt", e.target.value)}
              className={inputClass}
            />
          </Field>
        ) : (
          <Field label="置顶" hint="勾选后会出现在列表最上方">
            <label className="hv-input inline-flex h-10 items-center gap-2 px-3 text-sm">
              <input
                type="checkbox"
                name="pinned"
                checked={state.pinned}
                onChange={(e) => update("pinned", e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              <span className="inline-flex items-center gap-1.5"><Pin className="h-3.5 w-3.5 text-muted" aria-hidden />置顶这篇文章</span>
            </label>
          </Field>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <Field
          label="所属系列 (可选)"
          hint="同名文章会自动归入同一系列，留空表示不属于任何系列"
        >
          <input
            name="series"
            type="text"
            placeholder="例如：Hypervoid 搭建笔记"
            value={state.series}
            onChange={(e) => update("series", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="系列内序号" hint="第几篇">
          <input
            name="seriesOrder"
            type="number"
            min={1}
            value={state.seriesOrder}
            onChange={(e) => update("seriesOrder", e.target.value)}
            disabled={!state.series.trim()}
            className={`${inputClass} ${!state.series.trim() ? "cursor-not-allowed opacity-50" : ""}`}
          />
        </Field>
      </div>

      <Field label="正文 (MDX)" required>
        <div
          className="flex flex-col gap-2"
          onDragOver={(e) => {
            // Only intercept .md file drags, not internal text drags
            if (e.dataTransfer.types.includes("Files")) {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }
          }}
          onDrop={(e) => {
            const file = e.dataTransfer.files?.[0];
            if (file && /\.(md|markdown|mdx)$/i.test(file.name)) {
              e.preventDefault();
              onMdImport(file);
            }
          }}
        >
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => contentInputRef.current?.click()}
              disabled={uploading !== null}
              className="hv-action px-3 py-1.5 text-xs disabled:opacity-50"
            >
              {uploading === "content" ? "上传中…" : (<><ImagePlus className="h-3.5 w-3.5" aria-hidden /> 插入图片</>)}
            </button>
            <input
              ref={contentInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) =>
                onContentImageUpload(e.currentTarget.files?.[0] ?? null)
              }
            />
          </div>
          <textarea
            ref={contentRef}
            name="content"
            required
            rows={20}
            value={state.content}
            onChange={(e) => update("content", e.target.value)}
            className={`${inputClass} font-mono text-sm`}
            placeholder="在此粘贴 MDX 正文，或拖拽 .md 文件到此处导入"
          />
        </div>
      </Field>

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-3">
          <Link
            href="/admin/posts"
            className="hv-action px-4 py-2 text-sm"
          >
            取消
          </Link>
          {mode === "edit" && onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deletePending}
              className="border border-red-400/35 bg-red-500/10 px-4 py-2 text-sm text-red-100 hover:border-red-300 disabled:opacity-50"
            >
              {deletePending ? "删除中…" : (<><Trash2 className="mr-1 inline h-4 w-4" aria-hidden /> 删除</>)}
            </button>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="hv-action px-5 py-2 text-sm font-medium disabled:opacity-50"
        >
          {pending ? "保存中…" : mode === "new" ? "创建" : "保存"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "hv-input w-full px-3 py-2 text-sm";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-red-300"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
