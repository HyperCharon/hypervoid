import type { Metadata } from "next";
import { ReaderShell } from "@/components/reader/ReaderShell";

export const metadata: Metadata = {
  title: "阅读器",
  description: "轻量级在线阅读器 — 支持 .epub / .md / .txt 格式，快速阅读与小说模式切换。",
};

export default function ReaderPage() {
  return <ReaderShell />;
}
