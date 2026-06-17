import type { Metadata } from "next";
import { auth } from "@/auth";
import { ReaderShell } from "@/components/reader/ReaderShell";

export const metadata: Metadata = {
  title: "阅读器",
  description: "轻量级在线阅读器 — 支持 .md / .txt 文件快速阅读。",
};

export default async function ReaderPage() {
  const session = await auth().catch(() => null);
  const isAdmin = Boolean((session?.user as any)?.isAdmin);
  return <ReaderShell isAdmin={isAdmin} />;
}
