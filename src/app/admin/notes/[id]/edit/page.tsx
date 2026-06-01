import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, schema } from "@/db/client";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { AnnouncementForm } from "../../AnnouncementForm";
import { updateAction } from "../../actions";

export const metadata: Metadata = {
  title: "编辑公告",
  robots: { index: false, follow: false },
};

function toLocalInput(d: Date | null): string {
  if (!d) return "";
  // datetime-local needs YYYY-MM-DDTHH:mm in the user's *local* tz
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditAnnouncementPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const { id } = await props.params;
  const rows = await getDb()
    .select()
    .from(schema.announcements)
    .where(eq(schema.announcements.id, id))
    .limit(1);
  const ann = rows[0];
  if (!ann) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <AdminBackLink href="/admin/notes" label="公告列表" />
        <h1 className="text-2xl font-bold tracking-tight">编辑公告</h1>
      </header>

      <AnnouncementForm
        action={async (formData) => {
          "use server";
          await updateAction(id, formData);
          redirect("/admin/notes");
        }}
        defaults={{
          slot: ann.slot,
          message: ann.message,
          link: ann.link ?? "",
          linkText: ann.linkText ?? "",
          startsAt: toLocalInput(ann.startsAt),
          endsAt: toLocalInput(ann.endsAt),
          priority: ann.priority,
          active: ann.active,
        }}
        submitLabel="保存修改"
      />
    </div>
  );
}
