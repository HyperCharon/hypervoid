import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { listAlbums } from "@/db/albums";
import { AdminBackLink } from "@/components/admin/AdminBackLink";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "相册管理",
  robots: { index: false, follow: false },
};

export default async function AdminAlbumsList() {
  const albums = await listAlbums();

  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return (
    <div className="flex flex-col gap-6">
      <header className="hv-panel-sci relative overflow-hidden flex flex-col gap-4 p-4 sm:p-6 sm:flex-row sm:items-end sm:justify-between">
        {/* Corner accents */}
        <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-accent/60 pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-10 w-10 border-r-2 border-b-2 border-accent/60 pointer-events-none" />

        <div className="space-y-3">
          <AdminBackLink href="/admin" label="后台" />
          <div>
            <p className="hv-kicker uppercase">ALBUM_REGISTRY</p>
            <h1 className="hv-title mt-1 font-mono text-2xl font-semibold tracking-wider uppercase">相册管理</h1>
            <p className="mt-2 font-mono text-sm text-muted uppercase">{albums.length} COLLECTIONS</p>
          </div>
        </div>
        <Link href="/admin/albums/new" className="hv-action px-4 text-sm font-mono uppercase hover:shadow-[0_0_20px_var(--accent-glow)]">
          <Plus className="h-4 w-4" aria-hidden="true" />
          NEW_ALBUM
        </Link>
      </header>

      {albums.length === 0 ? (
        <p className="hv-panel-sci border-dashed p-8 text-center text-sm text-muted">还没有相册。</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <Link key={a.id} href={"/admin/albums/" + a.id + "/edit"} className="hv-panel-sci group overflow-hidden p-0">
              {a.coverUrl ? (
                <Image src={a.coverUrl} alt="" width={480} height={270} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw" className="aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
              ) : (
                <div className="aspect-video w-full bg-accent/8" />
              )}
              <div className="p-4">
                <p className="font-mono font-semibold uppercase tracking-wide text-foreground group-hover:text-foreground">{a.name}</p>
                <p className="font-mono text-xs text-muted">/albums/{a.slug} · #{a.sortOrder}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
