import Link from "next/link";
import { CalendarClock, Clock, Flame, Layers, NotebookPen, Play, Target } from "lucide-react";
import { getDashboardStats } from "@/db/study-stats";
import { listDecksWithCounts } from "@/db/study-decks";
import { getStudySettings } from "@/db/study-settings";
import { getTodayTotals } from "@/db/study-sessions";
import { getToolsBase } from "@/lib/study/server";
import { subjectLabel, SUBJECTS, type Subject } from "@/lib/study/subjects";
import { StudyHeatmap } from "@/components/tools/StudyHeatmap";

export const dynamic = "force-dynamic";

export default async function ToolsDashboard() {
  const [base, stats, decks, settings, todayTotals] = await Promise.all([
    getToolsBase(),
    getDashboardStats(),
    listDecksWithCounts(),
    getStudySettings(),
    getTodayTotals(),
  ]);

  // Aggregate due/total cards by subject for the breakdown.
  const bySubject = new Map<Subject, { due: number; total: number }>();
  for (const d of decks) {
    const prev = bySubject.get(d.subject) ?? { due: 0, total: 0 };
    prev.due += d.due;
    prev.total += d.total;
    bySubject.set(d.subject, prev);
  }

  // Per-subject study minutes today (for goal progress).
  const todayMinutes = new Map<Subject, number>();
  for (const t of todayTotals) {
    todayMinutes.set(t.subject, Math.round(t.seconds / 60));
  }
  const goals = (settings.dailyMinuteGoals ?? {}) as Record<string, number>;
  const hasGoals = SUBJECTS.some((s) => (goals[s] ?? 0) > 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Countdown */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
        {stats.daysUntilExam !== null ? (
          <>
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
            {/* Subtle accent glow in bottom-right */}
            <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-accent/5 blur-2xl" />
          </>
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

      {/* Quick actions */}
      {(stats.dueCards > 0 || stats.dueMistakes > 0) && (
        <div className="flex gap-2">
          {stats.dueCards > 0 && (
            <Link
              href={`${base}/flashcards`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground"
            >
              <Play className="h-4 w-4" aria-hidden /> 复习单词
            </Link>
          )}
          {stats.dueMistakes > 0 && (
            <Link
              href={`${base}/mistakes/review`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-accent/40 py-2.5 text-sm font-medium text-accent"
            >
              <Play className="h-4 w-4" aria-hidden /> 复习错题
            </Link>
          )}
        </div>
      )}

      {/* Primary tools */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`${base}/flashcards`}
          className="group rounded-2xl border border-border bg-card p-4 transition-all hover:border-accent/30 hover:bg-card-hover hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent/20">
            <Layers className="h-5 w-5" aria-hidden />
          </div>
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
          className="group rounded-2xl border border-border bg-card p-4 transition-all hover:border-accent/30 hover:bg-card-hover hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent/20">
            <NotebookPen className="h-5 w-5" aria-hidden />
          </div>
          <p className="mt-3 font-medium">错题本</p>
          <p className="mt-1 text-sm text-muted">
            <span className="text-foreground">{stats.dueMistakes}</span> 待复习
          </p>
        </Link>
      </div>

      {/* Per-subject card breakdown */}
      {bySubject.size > 0 && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-medium text-muted">各科卡片</h2>
          <div className="flex flex-col gap-1.5">
            {[...bySubject.entries()].map(([s, c]) => (
              <div key={s} className="flex items-center justify-between text-sm">
                <span>{subjectLabel(s)}</span>
                <span className="tabular-nums text-muted">
                  {c.due > 0 && <span className="mr-1 text-accent">{c.due} 待复习</span>}
                  共 {c.total}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Today stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Flame, value: stats.streak, label: "连续天数", color: "text-orange-400", bg: "bg-orange-400/10" },
          { icon: Layers, value: stats.reviewsToday, label: "今日复习", color: "text-accent-soft", bg: "bg-accent/10" },
          { icon: Clock, value: stats.todayStudyMinutes, label: "今日分钟", color: "text-accent", bg: "bg-accent/10" },
        ].map(({ icon: Icon, value, label, color, bg }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-3 text-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} aria-hidden />
            </div>
            <p className="text-xl font-semibold tabular-nums">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Daily goal progress */}
      {hasGoals && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-accent" aria-hidden />
            <h2 className="text-sm font-medium text-muted">今日目标</h2>
          </div>
          <div className="flex flex-col gap-2.5">
            {SUBJECTS.filter((s) => (goals[s] ?? 0) > 0).map((s) => {
              const goal = goals[s];
              const done = todayMinutes.get(s) ?? 0;
              const pct = Math.min(100, Math.round((done / goal) * 100));
              const done_class = pct >= 100 ? "text-accent" : "text-foreground";
              return (
                <div key={s}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span>{subjectLabel(s)}</span>
                    <span className={done_class}>
                      {done}/{goal}′
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
                    <div
                      className={`h-full transition-all duration-300 ${pct >= 100 ? "bg-accent" : "bg-accent/60"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
