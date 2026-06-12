import Link from "next/link";
import { notFound } from "next/navigation";
import { getMistake } from "@/db/study-mistakes";
import { getToolsBase } from "@/lib/study/server";
import { MistakeEditForm } from "@/components/tools/MistakeEditForm";

export const dynamic = "force-dynamic";

export default async function EditMistakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [base, mistake] = await Promise.all([getToolsBase(), getMistake(id)]);
  if (!mistake) notFound();

  return (
    <div className="flex flex-col gap-4">
      <Link href={`${base}/mistakes`} className="text-sm text-muted">
        ← 错题本
      </Link>
      <h1 className="text-lg font-semibold">编辑错题</h1>
      <MistakeEditForm mistake={mistake} base={base} />
    </div>
  );
}
