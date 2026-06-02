"use client";

import { Trash2 } from "lucide-react";
import { deleteQuickNoteAction } from "./actions";

export function DeleteNoteButton({ id }: { id: string }) {
  return (
    <form
      action={async (formData) => {
        await deleteQuickNoteAction(formData);
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded p-1 text-muted-soft opacity-0 transition hover:bg-card-hover hover:text-danger group-hover:opacity-100"
        aria-label="删除"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
