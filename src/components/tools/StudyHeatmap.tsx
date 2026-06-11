function level(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

/** GitHub-style contribution grid: columns = weeks, rows = weekdays. */
export function StudyHeatmap({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  return (
    <div className="overflow-x-auto">
      <div className="grid w-max grid-flow-col grid-rows-7 gap-1">
        {data.map((d) => (
          <div
            key={d.date}
            title={`${d.date}：${d.count} 次复习`}
            className="h-3 w-3 rounded-[2px]"
            style={{ backgroundColor: `var(--heatmap-${level(d.count)})` }}
          />
        ))}
      </div>
    </div>
  );
}
