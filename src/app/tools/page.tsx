import Link from "next/link";
import { CalendarClock, Clock, Flame, Layers, NotebookPen } from "lucide-react";
import { getDashboardStats } from "@/db/study-stats";
import { getToolsBase } from "@/lib/study/server";
import { StudyHeatmap } from "@/components/tools/StudyHeatmap";

export const dynamic = "force-dynamic";

export default async function ToolsDashboard() {
  const [base, stats] = await Promise.all([getToolsBase(), getDashboardStats()]);

  return (
    <div className="flex flex-col gap-4">
      {/* Countdown */}
      <section className="rounded-2xl border border-border bg-card p-5">
        {stats.daysUntilExam !== null ? (
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-muted">距考研初试</p>
              <p className="mt-1 font-display text-5xl font-bold tabular-nums text-accent">
                {Math.max(stats.daysUntilExam, 0)}
                <span className="ml-1 text-lg text-muted">天</span>
              </p>
            </div>
            <CalendarClock className="h-10 w-10 text-accent/40" aria-hidden />
          </div>
        ) : (
          <Link
            href={`${base}/settings`}
            className="flex items-center justify-between"
          >
            <span className="text-sm text-muted">设置考研初试日期，开始倒计时</span>
            <span className="text-sm text-accent">去设置 →</span>
          </Link>
        )}
      </section>

      {/* Primary tools */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`${base}/flashcards`}
          className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-card-hover"
        >
          <Layers className="h-6 w-6 text-accent" aria-hidden />
          <p className="mt-3 font-medium">背单词</p>
          <p className="mt-1 text-sm text-muted">
            <span className="text-foreground">{stats.dueCards}</span> 待复习
            {stats.newCards > 0 && (
              <span className="ml-2 text-accent-soft">{stats.newCards} 新</span>
            )}
          </p>
        </Link>
        <Link
          href={`${base}/mistakes`}
          className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-card-hover"
        >
          <NotebookPen className="h-6 w-6 text-accent" aria-hidden />
          <p className="mt-3 font-medium">错题本</p>
          <p className="mt-1 text-sm text-muted">
            <span className="text-foreground">{stats.dueMistakes}</span> 待复习
          </p>
        </Link>
      </div>

      {/* Today stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <Flame className="mx-auto h-5 w-5 text-orange-400" aria-hidden />
          <p className="mt-2 text-2xl font-semibold tabular-nums">{stats.streak}</p>
          <p className="text-xs text-muted">连续天数</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <Layers className="mx-auto h-5 w-5 text-accent-soft" aria-hidden />
          <p className="mt-2 text-2xl font-semibold tabular-nums">{stats.reviewsToday}</p>
          <p className="text-xs text-muted">今日复习</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <Clock className="mx-auto h-5 w-5 text-accent" aria-hidden />
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {stats.todayStudyMinutes}
          </p>
          <p className="text-xs text-muted">今日分钟</p>
        </div>
      </div>

      {/* Heatmap */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-muted">复习热力图</h2>
        <StudyHeatmap data={stats.heatmap} />
      </section>

      {/* Footnote stats */}
      <p className="px-1 text-xs text-muted">
        共 {stats.totalCards} 张卡片 · 错题 {stats.totalMistakes} 道（已掌握{" "}
        {stats.masteredMistakes}）
      </p>
    </div>
  );
}
