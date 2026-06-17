import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PostEditor } from "@/components/admin/PostEditor";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { createPostAction } from "@/app/admin/posts/actions";

export const metadata: Metadata = {
  title: "新建文章",
  robots: { index: false, follow: false },
};

export default function NewPostPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <AdminBackLink href="/admin/posts" label="文章列表" />
        <h1 className="text-2xl font-bold tracking-tight">新建文章</h1>
      </header>
      <PostEditor mode="new" onSubmit={createPostAction} />
    </div>
  );
}
