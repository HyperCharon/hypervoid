import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AlbumForm } from "@/components/admin/AlbumForm";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { createAlbumAction } from "@/app/admin/albums/actions";

export const metadata: Metadata = {
  title: "新建相册",
  robots: { index: false, follow: false },
};

export default function NewAlbumPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <AdminBackLink href="/admin/albums" label="相册列表" />
        <h1 className="text-2xl font-bold tracking-tight">新建相册</h1>
      </header>
      <AlbumForm mode="new" onSubmit={createAlbumAction} />
    </div>
  );
}
