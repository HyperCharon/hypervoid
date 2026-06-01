import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { AnnouncementForm } from "../AnnouncementForm";
import { createAction } from "../actions";

export const metadata: Metadata = {
  title: "新建公告",
  robots: { index: false, follow: false },
};

export default async function NewAnnouncementPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <AdminBackLink href="/admin/notes" label="公告列表" />
        <h1 className="text-2xl font-bold tracking-tight">新建公告</h1>
      </header>

      <AnnouncementForm
        action={async (formData) => {
          "use server";
          await createAction(formData);
          redirect("/admin/notes");
        }}
        defaults={{
          slot: "top",
          message: "",
          link: "",
          linkText: "",
          startsAt: "",
          endsAt: "",
          priority: 0,
          active: true,
        }}
        submitLabel="创建公告"
      />
    </div>
  );
}
