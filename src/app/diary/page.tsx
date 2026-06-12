import type { Metadata } from "next";
import { auth } from "@/auth";
import { listQuickNotes } from "@/db/quick-notes";
import { formatDateCN } from "@/lib/datetime";
import { QuickNoteForm } from "./QuickNoteForm";
import { DeleteNoteButton } from "./DeleteNoteButton";

export const metadata: Metadata = { title: "日记" };
export const revalidate = 60;

export default async function DiaryPage() {
  const session = await auth();
  const isAdmin = !!(session?.user as { isAdmin?: boolean } | undefined)?.isAdmin;
  const notes = await listQuickNotes();

  return (
    <div className="flex flex-col gap-6">
      <header className="hv-panel relative overflow-hidden p-5 sm:p-7">
        <p className="hv-kicker">Diary / Daily_Fragments</p>
        <h1 className="hv-title mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
          日记
        </h1>
        <p className="mt-2 text-sm text-muted">短小、随性、不打算长期保存的碎片。</p>
      </header>

      {/* Admin: quick note input */}
      {isAdmin && <QuickNoteForm />}

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted">
          还没有随手记。
        </div>
      ) : (
        notes.map((note) => (
          <article
            key={note.id}
            className="group relative rounded-xl border border-border bg-card p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <time className="text-xs uppercase tracking-wider text-muted">
                {formatDateCN(note.createdAt)}
              </time>
              {isAdmin && <DeleteNoteButton id={note.id} />}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
              {note.content}
            </p>
          </article>
        ))
      )}
    </div>
  );
}
