import {
  getDailyTotals,
  getStudySummary,
  getSubjectTotals,
  getTodayTotals,
  getWeeklySubjectTotals,
  listRecentSessions,
} from "@/db/study-sessions";
import { PomodoroTimer } from "@/components/tools/PomodoroTimer";
import { SessionList } from "@/components/tools/SessionList";
import { SubjectLogChart } from "@/components/tools/SubjectLogChart";
import { SUBJECTS, SUBJECT_LABELS, subjectLabel, type Subject } from "@/lib/study/subjects";
import { logManualSessionAction } from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";

function fmtHours(sec: number): string {
  if (sec < 60) return `${sec}秒`;
  if (sec < 3600) return `${Math.round(sec / 60)}分钟`;
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return m > 0 ? `${h}小时${m}分` : `${h}小时`;
}

export default async function TimerPage() {
  const [today, daily, recent, allTime, weekly, summary] = await Promise.all([
    getTodayTotals(),
    getDailyTotals(7),
    listRecentSessions(8),
    getSubjectTotals(),
    getWeeklySubjectTotals(),
    getStudySummary(),
  ]);

  const todayTotalSec = today.reduce((s, t) => s + t.seconds, 0);
  const weeklyTotalSec = weekly.reduce((s, t) => s + t.seconds, 0);

  // Build maps for easy lookup
  const allTimeMap = new Map(allTime.map((t) => [t.subject, t.seconds]));
  const weeklyMap = new Map(weekly.map((t) => [t.subject, t.seconds]));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">学习计时</h1>

      <PomodoroTimer todaySeconds={todayTotalSec} />

      {/* Today quick stats */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-muted">今日</h2>
          <span className="text-sm">
            <span className="text-xl font-semibold tabular-nums">
              {Math.round(todayTotalSec / 60)}
            </span>{" "}
            分钟
          </span>
        </div>
        {today.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {today.map((t) => (
              <span
                key={t.subject}
                className="rounded-full bg-accent-glow px-2 py-0.5 text-xs font-medium text-accent"
              >
                {subjectLabel(t.subject)} {Math.round(t.seconds / 60)}′
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Per-subject totals (all-time) */}
      {allTime.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium text-muted">各科总时长</h2>
          <div className="flex flex-col gap-2.5">
            {SUBJECTS.map((s) => {
              const total = allTimeMap.get(s) ?? 0;
              if (total === 0) return null;
              const maxSec = Math.max(...allTime.map((t) => t.seconds));
              const pct = maxSec > 0 ? Math.round((total / maxSec) * 100) : 0;
              return (
                <div key={s}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{subjectLabel(s)}</span>
                    <span className="tabular-nums text-muted">{fmtHours(total)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full bg-accent/70 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 border-t border-border pt-3 flex items-center justify-between text-sm">
            <span className="text-muted">总计</span>
            <span className="font-semibold tabular-nums">{fmtHours(summary.totalSeconds)}</span>
          </div>
        </section>
      )}

      {/* Study summary stats */}
      {summary.totalSessions > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "总专注次数", value: `${summary.totalSessions}` },
            { label: "平均时长", value: `${Math.round(summary.avgSessionSec / 60)} 分钟` },
            { label: "最长一次", value: `${Math.round(summary.longestSessionSec / 60)} 分钟` },
            { label: "学习天数", value: `${summary.activeDays} 天` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-card px-3 py-2.5 text-center">
              <p className="text-sm font-semibold tabular-nums">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Weekly breakdown by subject */}
      {weekly.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-medium text-muted">本周各科</h2>
            <span className="text-xs text-muted">{fmtHours(weeklyTotalSec)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((s) => {
              const sec = weeklyMap.get(s) ?? 0;
              if (sec === 0) return null;
              const pct = weeklyTotalSec > 0 ? Math.round((sec / weeklyTotalSec) * 100) : 0;
              return (
                <div
                  key={s}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs"
                >
                  <div className="h-2 w-2 rounded-full bg-accent" style={{ opacity: 0.3 + (pct / 100) * 0.7 }} />
                  <span>{subjectLabel(s)}</span>
                  <span className="tabular-nums text-muted">{Math.round(sec / 60)}′</span>
                  <span className="text-muted-soft">({pct}%)</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 7-day chart */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-muted">近 7 天（分钟）</h2>
        <SubjectLogChart data={daily} />
      </section>

      {/* Manual log */}
      <details className="rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium">手动记录</summary>
        <form action={logManualSessionAction} className="mt-3 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <select name="subject" defaultValue="english" className={inputClass}>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {SUBJECT_LABELS[s]}
                </option>
              ))}
            </select>
            <input
              type="number"
              name="minutes"
              min={1}
              placeholder="分钟"
              className={inputClass}
              required
            />
          </div>
          <input name="note" placeholder="备注（可选）" className={inputClass} />
          <button
            type="submit"
            className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            记录
          </button>
        </form>
      </details>

      {/* Recent sessions */}
      <SessionList
        sessions={recent.map((s) => ({
          id: s.id,
          subject: s.subject,
          startedAt: s.startedAt.toISOString(),
          durationSec: s.durationSec,
          note: s.note,
        }))}
      />
    </div>
  );
}
