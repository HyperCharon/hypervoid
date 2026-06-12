"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteSessionAction } from "@/app/tools/timer/actions";
import { subjectLabel, type Subject } from "@/lib/study/subjects";

type Session = {
  id: string;
  subject: Subject;
  startedAt: string;
  durationSec: number;
  note: string | null;
};

function fmtTime(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function SessionList({ sessions }: { sessions: Session[] }) {
  const [items, setItems] = useState(sessions);
  const [, startTransition] = useTransition();

  function remove(id: string) {
    startTransition(async () => {
      try {
        await deleteSessionAction(id);
        setItems((prev) => prev.filter((s) => s.id !== id));
      } catch {
        // best-effort
      }
    });
  }

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="px-1 text-sm font-medium text-muted">最近记录</h2>
      {items.map((s) => (
        <div
          key={s.id}
          className="group flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <div className="flex flex-col">
            <span className="text-muted">{fmtTime(new Date(s.startedAt))}</span>
            {s.note && <span className="mt-0.5 text-xs text-muted-soft">{s.note}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span>
              {subjectLabel(s.subject)} ·{" "}
              <span className="tabular-nums">{Math.round(s.durationSec / 60)}</span>{" "}
              分钟
            </span>
            <button
              type="button"
              onClick={() => remove(s.id)}
              aria-label="删除"
              className="rounded p-1 text-muted opacity-0 transition-opacity hover:text-[var(--danger)] group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
