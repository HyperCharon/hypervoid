import { getStudySettings } from "@/db/study-settings";
import { dayKey } from "@/lib/study/dates";
import { updateStudySettingsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ToolsSettingsPage() {
  const s = await getStudySettings();
  const examValue = s.examDate ? dayKey(new Date(s.examDate)) : "";

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
