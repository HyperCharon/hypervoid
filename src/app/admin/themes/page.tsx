import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { getCustomTheme } from "@/lib/custom-theme";
import { ThemeEditor } from "./ThemeEditor";

export const metadata: Metadata = {
  title: "主题定制",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminThemesPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const theme = await getCustomTheme();

  return (
    <div className="flex flex-col gap-6">
      <header className="hv-panel-sci relative overflow-hidden flex items-center gap-3 p-5 sm:p-6">
        {/* Corner accents */}
        <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-accent/60 pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-10 w-10 border-r-2 border-b-2 border-accent/60 pointer-events-none" />
        {/* Pulse beacon */}
        <span className="absolute right-5 top-5 h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />

        <AdminBackLink href="/admin" label="后台" />
        <h1 className="hv-title font-mono text-2xl font-bold tracking-wider uppercase">THEME_EDITOR</h1>
      </header>

      <p className="text-sm text-muted">
        在这里调节 7 个核心 CSS 变量，浅色 / 深色模式分别保存。启用后会覆盖
        内置的 6 套预设——访客无需任何操作即可看到新配色。
      </p>

      <ThemeEditor initial={theme} />
    </div>
  );
}
