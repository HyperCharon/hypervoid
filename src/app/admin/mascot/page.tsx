import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import {
  getSiteOverride,
  setSiteOverrides,
  type OverridableFields,
} from "@/lib/site-config-server";

export const metadata: Metadata = {
  title: "看板娘设置",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type MascotId = "kanna" | "rem" | "ram";

type PolicyKey = "mascot.allowUserSwitch" | "mascot.showSwitchButton";

const MASCOTS: {
  id: MascotId;
  name: string;
  nameJa: string;
  source: string;
  desc: string;
  preview: "live2d" | "spine";
  tech: string;
}[] = [
  {
    id: "ram",
    name: "拉姆",
    nameJa: "ラム",
    source: "Re:Zero 从零开始的异世界生活",
    desc: "鬼族少女，粉发女仆。默认看板娘，前台用户可在本地切换角色。",
    preview: "spine",
    tech: "Official Spine 3.6 WebGL (json/atlas/texture)",
  },
  {
    id: "rem",
    name: "雷姆",
    nameJa: "レム",
    source: "Re:Zero 从零开始的异世界生活",
    desc: "鬼族少女，蓝发女仆。温柔、忠诚、勤劳，对话与聊天记录独立于其他角色。",
    preview: "spine",
    tech: "Official Spine 3.6 WebGL (json/atlas/texture)",
  },
  {
    id: "kanna",
    name: "康娜·卡姆依",
    nameJa: "カンナ・カムイ",
    source: "小林家的龙女仆",
    desc: "活了几千年的小龙女，看起来 7-8 岁。安静、慢热、偶尔毒舌。",
    preview: "live2d",
    tech: "Live2D (PixiJS + Cubism2)",
  },
];

const POLICIES: {
  key: PolicyKey;
  title: string;
  desc: string;
  onText: string;
  offText: string;
}[] = [
  {
    key: "mascot.allowUserSwitch",
    title: "允许用户切换角色",
    desc: "开启后，访客可以在看板娘旁边的列表里选择拉姆、雷姆或康娜；关闭后保留当前本地角色，不再接受新的切换操作。",
    onText: "允许切换",
    offText: "禁止切换",
  },
  {
    key: "mascot.showSwitchButton",
    title: "显示角色切换按钮",
    desc: "控制看板娘旁边的角色列表按钮是否出现在前台。关闭后站点设置面板仍只保留看板娘开关。",
    onText: "显示按钮",
    offText: "隐藏按钮",
  },
];

function isOn(value: string): boolean {
  return value !== "off";
}

function normalizeMascotId(value: string): MascotId {
  return value === "kanna" || value === "rem" || value === "ram"
    ? value
    : "ram";
}

async function setDefaultMascot(character: MascotId) {
  "use server";
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  await setSiteOverrides([
    { key: "mascot.defaultCharacter", value: normalizeMascotId(character) },
  ]);
  revalidatePath("/admin/mascot");
  revalidatePath("/api/mascot/policy");
}

async function setMascotPolicy(key: PolicyKey, enabled: boolean) {
  "use server";
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  await setSiteOverrides([
    { key: key as OverridableFields, value: enabled ? "on" : "off" },
  ]);
  revalidatePath("/admin/mascot");
  revalidatePath("/api/mascot/policy");
}

export default async function AdminMascotPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const [defaultCharacterRaw, ...values] = await Promise.all([
    getSiteOverride("mascot.defaultCharacter"),
    ...POLICIES.map((p) => getSiteOverride(p.key)),
  ]);
  const defaultCharacter = normalizeMascotId(defaultCharacterRaw);
  const policyState = new Map(
    POLICIES.map((p, i) => [p.key, isOn(values[i] ?? "on")]),
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="hv-panel-sci relative overflow-hidden p-5">
        {/* Corner accents */}
        <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-accent/60 pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-10 w-10 border-r-2 border-b-2 border-accent/60 pointer-events-none" />

        <AdminBackLink href="/admin" label="后台" />
        <p className="hv-kicker mt-4 uppercase">MASCOT_PROTOCOL</p>
        <h1 className="hv-title mt-1 font-mono text-2xl font-semibold tracking-wider uppercase">看板娘设置</h1>
      </header>

      <p className="text-sm text-muted">
        后台管理前台策略和新访客默认角色；已经在本机切换过角色的访客仍优先使用自己的本地选择。
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {POLICIES.map((policy) => {
          const enabled = policyState.get(policy.key) ?? true;
          return (
            <section
              key={policy.key}
              className="hv-panel-sci p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-mono text-base font-bold tracking-wide uppercase">
                    {policy.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {policy.desc}
                  </p>
                </div>
                <span
                  className={
                    "shrink-0 px-2.5 py-1 font-mono text-[11px] font-medium uppercase clip-path-[polygon(0_0,calc(100%-4px)_0,100%_4px,100%_100%,0_100%)] " +
                    (enabled
                      ? "bg-accent/12 text-foreground"
                      : "bg-muted/20 text-muted")
                  }
                >
                  {enabled ? "ON" : "OFF"}
                </span>
              </div>
              <form
                action={async () => {
                  "use server";
                  await setMascotPolicy(policy.key, !enabled);
                }}
                className="mt-4"
              >
                <button
                  type="submit"
                  className="border border-accent/20 bg-black/20 px-4 py-2 text-sm font-medium font-mono uppercase transition hover:border-accent/40 hover:text-foreground clip-path-[polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,0_100%)]"
                >
                  {enabled ? policy.offText : policy.onText}
                </button>
              </form>
            </section>
          );
        })}
      </div>

      <section className="hv-panel-sci p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-mono text-base font-bold tracking-wide uppercase">切换默认显示角色</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              只影响没有本地角色记录的新访客；不会覆盖已经切换过角色的用户。
            </p>
          </div>
          <span className="shrink-0 bg-accent/12 px-2.5 py-1 font-mono text-[11px] font-medium uppercase text-foreground clip-path-[polygon(0_0,calc(100%-4px)_0,100%_4px,100%_100%,0_100%)]">
            {MASCOTS.find((m) => m.id === defaultCharacter)?.name ?? "拉姆"}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {MASCOTS.map((m) => {
            const active = m.id === defaultCharacter;
            return (
              <form
                key={m.id}
                action={async () => {
                  "use server";
                  await setDefaultMascot(m.id);
                }}
              >
                <button
                  type="submit"
                  className={
                    "border px-4 py-2 text-sm font-medium font-mono uppercase transition clip-path-[polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,0_100%)] " +
                    (active
                      ? "border-accent bg-accent text-slate-950"
                      : "border-accent/20 bg-black/20 hover:border-accent/40 hover:text-foreground")
                  }
                >
                  {m.name}
                </button>
              </form>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MASCOTS.map((m) => (
          <article
            key={m.id}
            className="flex h-full flex-col gap-4 hv-panel-sci p-5 text-left"
          >
            <div className="flex items-start gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-muted/20 clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)]">
                {m.preview === "live2d" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/live2d/kobayaxi/Kobayaxi.2048/texture_00.png"
                    alt={m.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted">
                    <svg
                      className="h-7 w-7"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
                      <path d="m4 7 8 4 8-4" />
                      <path d="M12 11v10" />
                    </svg>
                    <span className="text-[10px] font-medium">Spine</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-mono text-lg font-bold tracking-wide">{m.name}</h2>
                  {m.id === defaultCharacter ? (
                    <span className="shrink-0 bg-accent px-2 py-0.5 font-mono text-[10px] font-medium uppercase text-slate-950 clip-path-[polygon(0_0,calc(100%-4px)_0,100%_4px,100%_100%,0_100%)]">
                      默认
                    </span>
                  ) : null}
                </div>
                <p className="font-mono text-xs text-muted">
                  {m.nameJa} · {m.source}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {m.desc}
                </p>
                <p className="mt-2 font-mono text-[10px] text-muted/80">
                  渲染: {m.tech}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="text-xs text-muted">
        <p className="font-mono font-medium uppercase">说明</p>
        <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
          <li>默认角色只影响新访客；角色本身由访客浏览器 localStorage 保存，后台不会覆盖。</li>
          <li>关闭“显示角色切换按钮”后，前台只保留看板娘开关和角色自身功能。</li>
          <li>关闭“允许用户切换角色”后，按钮可见时也不会执行角色切换。</li>
          <li>看板娘在移动端和管理后台页面默认隐藏。</li>
        </ul>
      </div>
    </div>
  );
}
