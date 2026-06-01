import type { Metadata } from "next";


export const metadata: Metadata = { title: "时间线" };

const EVENTS = [
  { date: "2026-05-23", title: "开始用 Next.js 重建博客 Hypervoid" },
  { date: "—", title: "更多事件，慢慢补充…" },
];

export default function TimelinePage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="hv-panel relative overflow-hidden p-5 sm:p-7">
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <div aria-hidden className="absolute left-0 top-0 h-8 w-8 border-l border-t border-accent/40" />
        <div aria-hidden className="absolute right-0 top-0 h-2 w-2 rounded-full bg-accent animate-pulse" />
        <p className="hv-kicker">Timeline / Event_Log</p>
        <h1 className="hv-title mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
          时间线
        </h1>
        <p className="mt-3 text-sm text-muted">
          个人重要节点与里程碑。
        </p>
      </header>
      <div className="hv-panel p-6">
        <ol className="relative ml-3 space-y-6 border-l border-border pl-6">
          {EVENTS.map((event) => (
            <li key={event.date + event.title}>
              <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-accent bg-accent/20" />
              <time className="font-mono text-xs uppercase tracking-wider text-muted">
                {event.date}
              </time>
              <p className="mt-1 text-base text-muted">{event.title}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
