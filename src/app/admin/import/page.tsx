import type { Metadata } from "next";
import { ImportForm } from "@/components/admin/ImportForm";
import { AdminBackLink } from "@/components/admin/AdminBackLink";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "导入文章",
  robots: { index: false, follow: false },
};

export default function ImportPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="hv-panel-sci relative overflow-hidden p-4 sm:p-6">
        {/* Corner accents */}
        <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-accent/60 pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-10 w-10 border-r-2 border-b-2 border-accent/60 pointer-events-none" />

        <AdminBackLink href="/admin" label="后台" />
        <p className="hv-kicker mt-4 uppercase">MARKDOWN_IMPORT</p>
        <h1 className="hv-title mt-1 font-mono text-2xl font-semibold tracking-wider uppercase">导入文章</h1>
      </header>
      <div className="max-w-2xl">
        <ImportForm />
      </div>
      <div className="hv-panel-sci max-w-2xl p-4 text-sm text-muted">
        <p className="font-mono font-medium uppercase text-foreground">格式说明</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>支持标准 Markdown + YAML frontmatter</li>
          <li>导入状态为「草稿」，需手动发布</li>
          <li>slug 由文件名生成（中文会保留）</li>
          <li>如 slug 已存在则跳过该文件</li>
        </ul>
      </div>
    </div>
  );
}
