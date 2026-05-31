"use client";

import { useTransition } from "react";
import {
  deleteGuestbookAction,
  hideGuestbookAction,
} from "@/app/guestbook/actions";

export function GuestbookAdminControls({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  const onHide = () => {
    if (!confirm("隐藏这条留言？")) return;
    startTransition(async () => {
      await hideGuestbookAction(id);
    });
  };

  const onDelete = () => {
    if (!confirm("永久删除这条留言？")) return;
    startTransition(async () => {
      await deleteGuestbookAction(id);
    });
  };

  return (
    <div className="flex gap-2 text-xs">
      <button
        type="button"
        onClick={onHide}
        disabled={pending}
        className="text-muted hover:text-foreground disabled:opacity-50"
      >
        隐藏
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
      >
        删除
      </button>
    </div>
  );
}
