import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  FriendEditor,
  type FriendEditorInitial,
} from "@/components/admin/FriendEditor";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { getFriend, type Friend } from "@/db/friends";
import {
  deleteFriendAction,
  updateFriendAction,
} from "@/app/admin/friends/actions";

type Params = { id: string };

function rowToInitial(row: Friend): FriendEditorInitial {
  return {
    name: row.name,
    url: row.url,
    avatar: row.avatar ?? "",
    description: row.description ?? "",
    sortOrder: String(row.sortOrder),
  };
}

export const metadata: Metadata = {
  title: "编辑友链",
  robots: { index: false, follow: false },
};

export default async function EditFriendPage(props: {
  params: Promise<Params>;
}) {
  const { id } = await props.params;
  const friend = await getFriend(id);
  if (!friend) notFound();

  const updateBound = updateFriendAction.bind(null, id);
  const deleteBound = deleteFriendAction.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <AdminBackLink href="/admin/friends" label="友链列表" />
        <h1 className="text-2xl font-bold tracking-tight">编辑友链</h1>
      </header>
      <FriendEditor
        mode="edit"
        initial={rowToInitial(friend)}
        onSubmit={updateBound}
        onDelete={deleteBound}
      />
    </div>
  );
}
