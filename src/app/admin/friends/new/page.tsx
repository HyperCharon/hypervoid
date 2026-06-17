import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { FriendEditor } from "@/components/admin/FriendEditor";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { createFriendAction } from "@/app/admin/friends/actions";

export const metadata: Metadata = {
  title: "添加友链",
  robots: { index: false, follow: false },
};

export default function NewFriendPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <AdminBackLink href="/admin/friends" label="友链列表" />
        <h1 className="text-2xl font-bold tracking-tight">添加友链</h1>
      </header>
      <FriendEditor mode="new" onSubmit={createFriendAction} />
    </div>
  );
}
