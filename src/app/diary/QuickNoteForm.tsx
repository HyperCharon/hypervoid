"use client";

import { useRef } from "react";
import { addQuickNoteAction } from "./actions";

export function QuickNoteForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addQuickNoteAction(formData);
        formRef.current?.reset();
      }}
      className="flex gap-2 rounded-xl border border-border bg-card p-4"
    >
      <input
        name="content"
        placeholder="随手记..."
        required
        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        记录
      </button>
    </form>
  );
}
