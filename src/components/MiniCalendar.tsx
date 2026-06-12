import { getMonthCalendar } from "@/lib/stats";
import { formatDateCN } from "@/lib/datetime";
import { getMessages } from "@/lib/i18n-server";

export async function MiniCalendar() {
  const todayStr = formatDateCN(new Date());
  const [year, month] = todayStr.split("-").map(Number);
  const [cal, t] = await Promise.all([getMonthCalendar(year, month - 1), getMessages()]);

  return (
    <div className="hv-card p-4">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-accent">
          {cal.year}_{String(cal.month + 1).padStart(2, '0')}
        </span>
        <span className="text-xs text-muted-soft">{cal.totalPosts} {t.calendar.posts}</span>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-0.5 text-center text-xs text-muted-soft">
        {t.calendar.dayHeaders.map((d, i) => (
          <div key={d} className={i === 0 || i === 6 ? "py-0.5 text-accent/60" : "py-0.5"}>{d}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-0.5">
        {cal.weeks.flat().map((cell) => {
          let cls = "grid aspect-square place-items-center rounded text-xs transition ";
          if (!cell.isInMonth) {
            cls += "text-muted-soft/20";
          } else if (cell.isToday) {
            cls += "bg-accent text-primary-foreground font-bold";
          } else if (cell.hasPost) {
            cls += "bg-accent/15 text-accent font-medium";
          } else {
            cls += "text-muted hover:bg-card-hover";
          }
          return (
            <div key={cell.date} title={cell.date} className={cls}>
              {cell.day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
