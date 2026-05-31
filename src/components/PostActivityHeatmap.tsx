import { getPostHeatmap } from "@/lib/stats";

const WEEKS = 18;

function cellColor(count: number): string {
  if (count <= 0) return "bg-[var(--heatmap-0)]";
  if (count === 1) return "bg-[var(--heatmap-1)]";
  if (count === 2) return "bg-[var(--heatmap-2)]";
  if (count === 3) return "bg-[var(--heatmap-3)]";
  return "bg-[var(--heatmap-4)]";
}

const MONTHS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

const DAY_ABBR: Record<number, string> = {
  1: "一",
  3: "三",
  5: "五",
};

function getMonth(d: Date): number {
  return new Date(d.getTime() + 8 * 3600_000).getUTCMonth();
}

export async function PostActivityHeatmap() {
  const days = await getPostHeatmap(WEEKS);

  const weeks: { date: string; count: number }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    weeks.push(days.slice(w * 7, w * 7 + 7));
  }

  const totalPosts = days.reduce((acc, d) => acc + d.count, 0);
  const activeDays = days.filter((d) => d.count > 0).length;

  const monthLabels = weeks.map((week, wi) => {
    const firstDay = week[0];
    if (!firstDay) return null;
    const m = getMonth(new Date(firstDay.date + "T00:00:00Z"));
    if (wi === 0) return m;
    const prev = weeks[wi - 1]?.[0];
    if (!prev) return null;
    const prevM = getMonth(new Date(prev.date + "T00:00:00Z"));
    return m !== prevM ? m : null;
  });

  return (
    <section className="hv-panel flex flex-col gap-2 p-4 sm:p-5">
      <div className="flex items-baseline gap-2 text-sm">
        <span className="font-semibold tracking-tight text-foreground">
          {totalPosts} 篇
        </span>
        <span className="text-xs text-muted-soft">
          过去 {WEEKS} 周 · {activeDays} 个活跃日
        </span>
      </div>

      {/* Month labels */}
      <div className="flex gap-[2px] pl-6">
        {monthLabels.map((m, i) => (
          <div key={i} className="relative h-3 flex-1">
            {m !== null ? (
              <span className="absolute left-0 top-0 text-xs leading-none text-muted-soft">
                {MONTHS[m]}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-[2px]">
        {/* Row 0-6: each row = day label + 18 week cells */}
        {[0, 1, 2, 3, 4, 5, 6].map((row) => (
          <div key={row} className="flex items-center gap-[2px]">
            <span className="mr-0.5 flex w-4 shrink-0 items-center justify-end pr-0.5 text-xs leading-none text-muted-soft">
              {DAY_ABBR[row] ?? ""}
            </span>
            {weeks.map((week) => {
              const day = week[row];
              if (!day) return <div key="empty" className="flex-1 aspect-square" />;
              return (
                <div
                  key={day.date}
                  title={`${day.date} · ${day.count} 篇文章`}
                  className={`flex-1 aspect-square  ${cellColor(day.count)}`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-[2px] text-xs text-muted-soft">
        <span className="mr-0.5">少</span>
        {[0, 1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`h-2.5 w-2.5  ${cellColor(n)}`}
          />
        ))}
        <span className="ml-0.5">多</span>
      </div>
    </section>
  );
}
