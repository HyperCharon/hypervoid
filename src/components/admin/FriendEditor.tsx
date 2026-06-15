"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";

export type FriendEditorInitial = {
  name: string;
  url: string;
  avatar: string;
  description: string;
  sortOrder: string;
};

const EMPTY: FriendEditorInitial = {
  name: "",
  url: "",
  avatar: "",
  description: "",
  sortOrder: "0",
};

const inputClass =
  "hv-input min-h-11 w-full px-3 text-sm";

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

export function FriendEditor({
  mode,
  initial = EMPTY,
  onSubmit,
  onDelete,
}: {
  mode: "new" | "edit";
  initial?: FriendEditorInitial;
  onSubmit: (formData: FormData) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [state, setState] = useState<FriendEditorInitial>(initial);
  const [pending, startTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const update = <K extends keyof FriendEditorInitial>(
    key: K,
    value: FriendEditorInitial[K],
  ) => setState((s) => ({ ...s, [key]: value }));

  const onAvatarUpload = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status})`);
      update("avatar", data.url as string);
    } catch (e) {
      setError(`头像上传失败：${(e as Error).message}`);
    } finally {
      setUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
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
    if (!confirm(`删除「${state.name}」？`)) return;
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
        <div className="border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="名字" required>
          <input
            name="name"
            type="text"
            required
            value={state.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="主页 URL" required>
          <input
            name="url"
            type="url"
            required
            placeholder="https://"
            value={state.url}
            onChange={(e) => update("url", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="头像 URL" hint="支持上传到 Vercel Blob">
        <div className="flex gap-2">
          <input
            name="avatar"
            type="url"
            value={state.avatar}
            onChange={(e) => update("avatar", e.target.value)}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploading}
            className="hv-action shrink-0 px-3 text-sm disabled:opacity-50"
          >
            {uploading ? "上传中…" : "上传"}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) =>
              onAvatarUpload(e.currentTarget.files?.[0] ?? null)
            }
          />
        </div>
      </Field>

      <Field label="一句话简介">
        <textarea
          name="description"
          rows={2}
          value={state.description}
          onChange={(e) => update("description", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="排序" hint="数字越小越靠前，默认 0">
        <input
          name="sortOrder"
          type="number"
          value={state.sortOrder}
          onChange={(e) => update("sortOrder", e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-3">
          <Link
            href="/admin/friends"
            className="hv-action px-4 text-sm"
          >
            取消
          </Link>
          {mode === "edit" && onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deletePending}
              className="border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-100 transition hover:border-red-300 disabled:opacity-50"
            >
              {deletePending ? "删除中…" : "删除"}
            </button>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="hv-action hv-chip-strong min-h-11 px-5 text-sm font-medium disabled:opacity-50"
        >
          {pending ? "保存中…" : mode === "new" ? "创建" : "保存"}
        </button>
      </div>
    </form>
  );
}
