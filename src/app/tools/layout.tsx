import type { Metadata, Viewport } from "next";
import { getStudySettings } from "@/db/study-settings";
import { daysUntil } from "@/lib/study/dates";
import { getToolsBase, requireToolsAdmin } from "@/lib/study/server";
import { ToolsTopBar } from "@/components/tools/ToolsTopBar";
import { ToolsTabBar } from "@/components/tools/ToolsTabBar";

export const metadata: Metadata = {
  title: "考研工具",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { viewportFit: "cover" };

export default async function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireToolsAdmin();
  const [base, settings] = await Promise.all([getToolsBase(), getStudySettings()]);
  const daysLeft = settings.examDate ? daysUntil(new Date(settings.examDate)) : null;

  return (
    <div className="relative min-h-[100dvh] bg-background text-foreground">
      <ToolsTopBar base={base} daysLeft={daysLeft} />
      <main className="mx-auto w-full max-w-2xl px-4 py-5 pb-28">{children}</main>
      <ToolsTabBar base={base} />
    </div>
  );
}
