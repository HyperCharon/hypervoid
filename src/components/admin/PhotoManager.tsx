"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import {
  addPhotoAction,
  deletePhotoAction,
} from "@/app/admin/albums/actions";

export function PhotoManager({
  albumId,
  photos,
}: {
  albumId: string;
  photos: { id: string; url: string; caption: string | null }[];
}) {
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error ?? `Upload failed (${res.status})`);
        await addPhotoAction(albumId, data.url, file.name.replace(/\.[^.]+$/, ""));
      }
    } catch (e) {
      setError(`上传失败：${(e as Error).message}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onDelete = (id: string) => {
    if (!confirm("删除这张照片？")) return;
    startTransition(async () => {
      try {
        await deletePhotoAction(id, albumId);
      } catch (e) {
        setError(`删除失败：${(e as Error).message}`);
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="hv-title text-lg font-semibold tracking-normal">照片 ({photos.length})</h2>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="hv-action px-4 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {uploading ? "上传中…" : (<><ImagePlus className="h-4 w-4" aria-hidden /> 上传照片</>)}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => onUpload(e.currentTarget.files)}
        />
      </div>
      {error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : null}
      {photos.length === 0 ? (
        <p className="hv-panel border-dashed p-8 text-center text-muted">
          这个相册还没有照片。
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <div
              key={p.id}
              className="group relative overflow-hidden border border-border bg-card"
            >
              <Image
                src={p.url}
                alt={p.caption ?? ""}
                width={400}
                height={400}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
              <button
                type="button"
                onClick={() => onDelete(p.id)}
                disabled={pending}
                className="dark-locked absolute right-1 top-1 hidden bg-red-500/90 px-2 py-1 text-xs text-white group-hover:inline-flex disabled:opacity-50"
              >
                <Trash2 className="mr-1 inline h-3.5 w-3.5" aria-hidden /> 删除
              </button>
              {p.caption ? (
                <p className="dark-locked absolute bottom-0 left-0 right-0 truncate bg-black/60 px-2 py-1 text-xs text-white">
                  {p.caption}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
