import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { getSiteOverride, setSiteOverrides, type OverridableFields } from "@/lib/site-config-server";

export const metadata: Metadata = {
  title: "视觉特效",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type EffectDef = {
  key: OverridableFields;
  name: string;
  desc: string;
};

const EFFECTS: EffectDef[] = [
  {
    key: "effects.playerWidget",
    name: "播放器小组件",
    desc: "模糊封面背景 + 波形进度条 + 封面光晕。开启后首页音乐小组件会显示更丰富的视觉效果。",
  },
  {
    key: "effects.clickParticles",
    name: "点击粒子",
    desc: "点击页面任意位置时产生粒子爆炸效果。",
  },
  {
    key: "effects.textSparkle",
    name: "文字选中火花",
    desc: "选中文字时在选区位置洒落星光火花。",
  },
  {
    key: "effects.particles",
    name: "粒子背景",
    desc: "页面背景粒子动画效果（预留，即将支持）。",
  },
  {
    key: "effects.glow",
    name: "光晕效果",
    desc: "全局光晕 / 辉光装饰效果（预留，即将支持）。",
  },
];

function ToggleIcon({ on }: { on: boolean }) {
  return (
    <svg
      className={`h-5 w-5 ${on ? "text-foreground" : "text-muted"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {on ? (
        <>
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="m9 12 2 2 4-4" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="10" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </>
      )}
    </svg>
  );
}

export default async function AdminEffectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const values = await Promise.all(
    EFFECTS.map((e) => getSiteOverride(e.key)),
  );

  async function toggleEffect(key: OverridableFields, current: string) {
    "use server";
    const s = await auth();
    if (!s?.user) redirect("/sign-in");
    const next = current === "on" ? "off" : "on";
    await setSiteOverrides([{ key, value: next }]);
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/admin/effects");
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="hv-panel-sci relative overflow-hidden p-5">
        {/* Corner accents */}
        <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-accent/60 pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-10 w-10 border-r-2 border-b-2 border-accent/60 pointer-events-none" />

        <AdminBackLink href="/admin" label="后台" />
        <p className="hv-kicker mt-4 uppercase">VISUAL_EFFECTS</p>
        <h1 className="hv-title mt-1 font-mono text-2xl font-semibold tracking-wider uppercase">视觉特效</h1>
      </header>

      <p className="text-sm text-muted">
        开关站点各处的视觉增强效果。默认全部关闭，按需启用。
        标记为「预留」的效果正在开发中，开启后暂时不会产生变化。
      </p>

      <div className="flex flex-col gap-3">
        {EFFECTS.map((effect, i) => {
          const isOn = values[i] === "on";
          return (
            <form key={effect.key} action={toggleEffect.bind(null, effect.key, values[i])}>
              <button
                type="submit"
                className={`flex w-full items-center gap-4 hv-panel-sci p-5 text-left transition ${
                  isOn
                    ? "border-accent/40 bg-accent/12 shadow-[0_0_18px_var(--accent-glow)]"
                    : "hover:border-accent/40"
                }`}
              >
                <div className="shrink-0">
                  <ToggleIcon on={isOn} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-mono text-sm font-semibold tracking-wide uppercase">
                      {effect.name}
                    </h2>
                    <span
                      className={`shrink-0 px-2 py-0.5 font-mono text-[10px] font-medium uppercase clip-path-[polygon(0_0,calc(100%-4px)_0,100%_4px,100%_100%,0_100%)] ${
                        isOn
                          ? "bg-accent/15 text-foreground"
                          : "bg-muted/30 text-muted"
                      }`}
                    >
                      {isOn ? "ONLINE" : "OFFLINE"}
                    </span>
                    {isOn ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> : null}
                  </div>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    {effect.desc}
                  </p>
                </div>
              </button>
            </form>
          );
        })}
      </div>

      <div className="text-xs text-muted">
        <p className="font-mono font-medium uppercase">说明</p>
        <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
          <li>所有特效默认关闭，需手动开启。</li>
          <li>设置保存在数据库中，切换后刷新前端即可生效，无需重新部署。</li>
          <li>未来新增的特效会自动出现在此页面。</li>
        </ul>
      </div>
    </div>
  );
}
