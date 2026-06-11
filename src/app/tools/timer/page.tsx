import {
  getDailyTotals,
  getTodayTotals,
  listRecentSessions,
} from "@/db/study-sessions";
import { PomodoroTimer } from "@/components/tools/PomodoroTimer";
import { SubjectLogChart } from "@/components/tools/SubjectLogChart";
import { SUBJECTS, SUBJECT_LABELS, subjectLabel } from "@/lib/study/subjects";
import { logManualSessionAction } from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";

function fmtTime(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function TimerPage() {
  const [today, daily, recent] = await Promise.all([
    getTodayTotals(),
    getDailyTotals(7),
    listRecentSessions(8),
  ]);
  const todayTotalMin = Math.round(
    today.reduce((s, t) => s + t.seconds, 0) / 60,
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">学习计时</h1>

      <PomodoroTimer />

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-muted">今日</h2>
          <span className="text-sm">
            <span className="text-xl font-semibold tabular-nums">
              {todayTotalMin}
            </span>{" "}
            分钟
          </span>
        </div>
        {today.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {today.map((t) => (
              <span
                key={t.subject}
                className="rounded-full bg-background px-2 py-0.5 text-xs text-muted"
              >
                {subjectLabel(t.subject)} {Math.round(t.seconds / 60)}′
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-muted">近 7 天（分钟）</h2>
        <SubjectLogChart data={daily} />
      </section>

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

      {recent.length > 0 && (
        <section className="flex flex-col gap-1.5">
          <h2 className="px-1 text-sm font-medium text-muted">最近</h2>
          {recent.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              <span className="text-muted">{fmtTime(new Date(s.startedAt))}</span>
              <span>
                {subjectLabel(s.subject)} ·{" "}
                <span className="tabular-nums">
                  {Math.round(s.durationSec / 60)}
                </span>{" "}
                分钟
              </span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
