"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { LockKeyhole, Pin } from "lucide-react";
import { bulkAction, type BulkOp } from "@/app/admin/posts/actions";

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  scheduled: "定时",
  published: "已发布",
};

const STATUS_CLASS: Record<string, string> = {
  draft: "border-border bg-card text-muted",
  scheduled: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  published: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
};

export type PostRow = {
  slug: string;
  title: string;
  category: string | null;
  status: string;
  visibility: string;
  pinned: boolean;
  publishAt: Date | null;
  updatedAt: Date;
};

function effectiveStatus(
  status: string,
  publishAt: Date | null,
): { key: string; suffix: string } {
  if (status === "scheduled" && publishAt && publishAt.getTime() <= Date.now()) {
    return { key: "published", suffix: " · 来自定时" };
  }
  return { key: status, suffix: "" };
}

export function PostsTable({
  posts,
  activeCategoryEmpty,
}: {
  posts: PostRow[];
  activeCategoryEmpty: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  const toggle = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === posts.length) setSelected(new Set());
    else setSelected(new Set(posts.map((p) => p.slug)));
  };

  const run = (op: BulkOp, confirmMsg?: string) => {
    if (selected.size === 0) return;
    if (confirmMsg && !confirm(confirmMsg.replace("{n}", String(selected.size)))) {
      return;
    }
    const slugs = [...selected];
    setStatus(null);
    startTransition(async () => {
      const { affected } = await bulkAction(slugs, op);
      setStatus(`已应用：${affected} 篇 ${LABELS[op]}`);
      setSelected(new Set());
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 ? (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 text-xs shadow-lg">
          <span className="font-medium">已选 {selected.size} 篇</span>
          <BulkBtn onClick={() => run("publish")} disabled={pending}>发布</BulkBtn>
          <BulkBtn onClick={() => run("draft")} disabled={pending}>转草稿</BulkBtn>
          <BulkBtn onClick={() => run("set-public")} disabled={pending}>公开</BulkBtn>
          <BulkBtn onClick={() => run("set-private")} disabled={pending}>私密</BulkBtn>
          <BulkBtn onClick={() => run("pin")} disabled={pending}>置顶</BulkBtn>
          <BulkBtn onClick={() => run("unpin")} disabled={pending}>取消置顶</BulkBtn>
          <BulkBtn onClick={() => run("delete", "确定要删除选中的 {n} 篇文章吗？此操作不可恢复。")} disabled={pending} danger>删除</BulkBtn>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto px-2 py-1 text-xs text-muted hover:text-foreground">取消选择</button>
        </div>
      ) : null}

      {status && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-300">
          {status}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[340px] text-sm">
          <thead className="border-b border-border text-left text-xs text-muted">
            <tr>
              <th className="w-10 px-2 py-3">
                <input
                  type="checkbox"
                  checked={selected.size === posts.length && posts.length > 0}
                  onChange={toggleAll}
                  className="accent-accent"
                  aria-label="全选"
                />
              </th>
              <th className="px-3 py-3 font-medium">标题</th>
              <th className="hidden md:table-cell px-3 py-3 font-medium">Slug</th>
              <th className="px-2 py-3 font-medium">状态</th>
              <th className="hidden sm:table-cell px-3 py-3 font-medium">发布</th>
              <th className="px-2 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  {activeCategoryEmpty ? "该分类下还没有文章。" : "还没有文章。点右上角新建。"}
                </td>
              </tr>
            ) : (
              posts.map((post) => {
                const eff = effectiveStatus(post.status, post.publishAt);
                const checked = selected.has(post.slug);
                return (
                  <tr
                    key={post.slug}
                    className={`border-t border-border transition-colors ${
                      checked ? "bg-accent/5" : "hover:bg-card-hover"
                    }`}
                  >
                    <td className="px-2 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(post.slug)}
                        className="accent-accent"
                        aria-label={`选择 ${post.title}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {post.pinned && <Pin className="mr-1 inline h-3.5 w-3.5 text-muted" aria-label="置顶" />}
                      {post.visibility === "private" && <LockKeyhole className="mr-1 inline h-3.5 w-3.5 text-amber-500" aria-label="私密" />}
                      {post.title}
                      {post.category && (
                        <span className="ml-2 inline-flex rounded bg-card-hover px-1.5 py-0.5 text-[10px] text-muted">
                          {post.category}
                        </span>
                      )}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 font-mono text-xs text-muted">{post.slug}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded border px-2 py-0.5 text-xs ${STATUS_CLASS[eff.key]}`}>
                        {STATUS_LABEL[eff.key]}
                        {eff.suffix && <span className="text-muted">{eff.suffix}</span>}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-xs text-muted">
                      {post.publishAt ? new Date(post.publishAt).toLocaleString("zh-CN") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/posts/${post.slug}/edit`} className="text-accent hover:underline">编辑</Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const LABELS: Record<BulkOp, string> = {
  publish: "已发布",
  draft: "转草稿",
  "set-public": "公开",
  "set-private": "私密",
  pin: "置顶",
  unpin: "取消置顶",
  delete: "删除",
};

function BulkBtn({
  onClick,
  disabled,
  danger,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50 ${
        danger
          ? "border border-red-500/30 text-red-600 dark:text-red-300 hover:bg-red-500/10"
          : "border border-border text-muted hover:text-foreground hover:bg-card-hover"
      }`}
    >
      {children}
    </button>
  );
}
