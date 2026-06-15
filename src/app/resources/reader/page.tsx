import type { Metadata } from "next";
import { NovelReader } from "@/components/reader/NovelReader";
import { MobileReader } from "@/components/reader/MobileReader";

export const metadata: Metadata = {
  title: "阅读器",
  description: "轻量级在线小说 / 文档阅读器，支持拖入 .md / .txt 文件直接阅读。",
};

export default function ReaderPage() {
  return (
    <>
      {/* Desktop reader — hidden on mobile */}
      <div className="hidden sm:block">
        <NovelReader />
      </div>
      {/* Mobile reader — hidden on desktop */}
      <div className="sm:hidden">
        <MobileReader />
      </div>
    </>
  );
}
