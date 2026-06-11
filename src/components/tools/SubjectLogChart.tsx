/** Simple hand-rolled bar chart: per-day study minutes (oldest → newest). */
export function SubjectLogChart({
  data,
}: {
  data: { date: string; minutes: number }[];
}) {
  const max = Math.max(60, ...data.map((d) => d.minutes));
  return (
    <div className="flex items-end justify-between gap-1.5">
      {data.map((d) => {
        const h = d.minutes > 0 ? Math.max(3, Math.round((d.minutes / max) * 96)) : 0;
        return (
          <div
            key={d.date}
            className="flex flex-1 flex-col items-center justify-end gap-1"
            title={`${d.date}：${d.minutes} 分钟`}
          >
            <span className="text-[10px] tabular-nums text-muted">
              {d.minutes || ""}
            </span>
            <div
              className="w-full rounded-t bg-accent/70"
              style={{ height: `${h}px` }}
            />
            <span className="text-[10px] text-muted">{d.date.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}
