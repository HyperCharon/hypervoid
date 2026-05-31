"use client";

import { useState, useRef } from "react";

export function FriendApplyForm() {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <p className="hv-panel border-dashed p-5 text-center text-sm text-muted">
        想交换友链？
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ml-1 text-accent underline underline-offset-2 hover:text-foreground transition"
        >
          点此申请
        </button>
      </p>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setDone(null);
    const fd = new FormData(e.target as HTMLFormElement);
    const body: Record<string, string> = {};
    fd.forEach((v, k) => { body[k] = String(v); });
    try {
      const res = await fetch("/api/friends/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        setDone(data.message ?? "已提交");
        formRef.current?.reset();
      } else {
        setError(data.error ?? "提交失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="hv-panel p-5">
      <h3 className="font-mono text-sm font-semibold uppercase tracking-wide text-accent">申请友链</h3>
      {done ? (
        <p className="mt-2 rounded-lg border border-green-400/30 bg-green-400/10 p-3 text-sm text-green-700 dark:text-green-300">
          {done}
        </p>
      ) : (
        <form ref={formRef} onSubmit={onSubmit} className="mt-3 flex flex-col gap-3">
          {/* Honeypot */}
          <div className="absolute opacity-0 pointer-events-none" aria-hidden>
            <input type="text" name="_website" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted">名称 *</span>
              <input
                name="name"
                required
                maxLength={30}
                className="hv-input px-3 py-2 text-sm"
                placeholder="博客名称"
                style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted">网址 *</span>
              <input
                name="url"
                type="url"
                required
                className="hv-input px-3 py-2 text-sm"
                placeholder="https://"
                style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted">简介</span>
            <input
              name="description"
              maxLength={120}
              className="hv-input px-3 py-2 text-sm"
              placeholder="简短介绍你的博客（可选）"
              style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted">邮箱</span>
            <input
              name="email"
              type="email"
              className="hv-input px-3 py-2 text-sm"
              placeholder="审核通过后通知你（可选）"
              style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
            />
          </label>
          {error && (
            <p className="rounded-lg border border-red-400/30 bg-red-400/10 p-2 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={sending}
              className="hv-action px-4 py-2 text-sm font-medium disabled:opacity-50"
              style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
            >
              {sending ? "提交中..." : "提交申请"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-muted-soft hover:text-accent transition"
            >
              取消
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
