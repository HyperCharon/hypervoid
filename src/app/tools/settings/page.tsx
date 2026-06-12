import { getStudySettings } from "@/db/study-settings";
import { dayKey } from "@/lib/study/dates";
import { SUBJECTS, SUBJECT_LABELS } from "@/lib/study/subjects";
import { updateStudySettingsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ToolsSettingsPage() {
  const s = await getStudySettings();
  const examValue = s.examDate ? dayKey(new Date(s.examDate)) : "";
  const goals = (s.dailyMinuteGoals ?? {}) as Record<string, number>;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">设置</h1>
      <form action={updateStudySettingsAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-muted">考研初试日期</span>
          <input
            type="date"
            name="examDate"
            defaultValue={examValue}
            className="rounded-lg border border-border bg-card px-3 py-2 text-foreground"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted">每日新词上限</span>
            <input
              type="number"
              name="dailyNewCards"
              min={0}
              defaultValue={s.dailyNewCards}
              className="rounded-lg border border-border bg-card px-3 py-2 text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted">每日复习上限</span>
            <input
              type="number"
              name="dailyReviewCap"
              min={0}
              defaultValue={s.dailyReviewCap}
              className="rounded-lg border border-border bg-card px-3 py-2 text-foreground"
            />
          </label>
        </div>

        <div className="border-t border-border pt-4">
          <h2 className="mb-3 text-sm font-medium text-muted">每日学习目标（分钟）</h2>
          <div className="grid grid-cols-2 gap-3">
            {SUBJECTS.map((s) => (
              <label key={s} className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">{SUBJECT_LABELS[s]}</span>
                <input
                  type="number"
                  name={`goal_${s}`}
                  min={0}
                  placeholder="0"
                  defaultValue={goals[s] ?? ""}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-foreground"
                />
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">留空或 0 表示不限制。Dashboard 会显示每日进度。</p>
        </div>

        <button
          type="submit"
          className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          保存
        </button>
      </form>
    </div>
  );
}
