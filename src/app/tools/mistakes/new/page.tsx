import Link from "next/link";
import { getToolsBase } from "@/lib/study/server";
import { MistakeForm } from "@/components/tools/MistakeForm";

export const dynamic = "force-dynamic";

export default async function NewMistakePage() {
  const base = await getToolsBase();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link href={`${base}/mistakes`} className="text-sm text-muted">
          ← 错题本
        </Link>
        <h1 className="text-base font-semibold">新增错题</h1>
        <span className="w-12" />
      </div>
      <MistakeForm />
    </div>
  );
}
