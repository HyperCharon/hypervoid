import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { getCvData, getCvArraysJson, isCvVisible } from "@/lib/cv-store";
import { CvEditor } from "./CvEditor";
import { setCvVisibleAction } from "./actions";

export const metadata: Metadata = {
  title: "简历管理",
  robots: { index: false, follow: false },
};

export default async function AdminCvPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const [data, arraysJson, visible] = await Promise.all([
    getCvData(),
    getCvArraysJson(),
    isCvVisible(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="hv-panel-sci relative overflow-hidden p-5 sm:p-6 flex items-center gap-3">
        <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-accent/60 pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-10 w-10 border-r-2 border-b-2 border-accent/60 pointer-events-none" />
        <span className="absolute right-5 top-5 h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        <AdminBackLink href="/admin" label="后台" />
        <h1 className="hv-title font-mono text-2xl font-black tracking-wider uppercase">CV_EDITOR</h1>
      </header>

      <p className="text-sm text-muted">
        编辑网页简历（<code className="rounded bg-foreground/5 px-1.5 py-0.5 text-xs">/cv</code>）。
        改动保存后即时生效，无需 redeploy。简历页强制深色、独立于站点主题。
      </p>

      {/* Visibility */}
      <section className="flex flex-col gap-3">
        <h2 className="hv-title font-mono text-lg font-semibold uppercase tracking-wider">VISIBILITY</h2>
        <form action={setCvVisibleAction} className="flex flex-col gap-3">
          {[
            { value: "1", label: "公开显示", desc: "标志旁出现「简历」入口，访客可访问 /cv（无需登录）" },
            { value: "0", label: "隐藏（默认）", desc: "入口不显示，/cv 对访客返回 404；仅管理员可预览" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-3 border p-4 transition-colors clip-path-[polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,0_100%)] ${
                (visible ? "1" : "0") === opt.value
                  ? "border-accent/40 bg-accent/12"
                  : "border-border bg-gradient-to-br from-card to-card hover:border-accent/40"
              }`}
            >
              <input
                type="radio"
                name="cv_visible"
                value={opt.value}
                defaultChecked={(visible ? "1" : "0") === opt.value}
                className="mt-0.5 accent-accent-soft"
              />
              <div>
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="mt-0.5 text-xs text-muted">{opt.desc}</p>
              </div>
            </label>
          ))}
          <div>
            <button
              type="submit"
              className="hv-action px-5 py-2 font-mono text-sm font-medium uppercase clip-path-[polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,0_100%)] hover:shadow-[0_0_20px_var(--accent-glow)]"
            >
              保存可见性
            </button>
          </div>
        </form>
        <p className="text-xs text-muted">
          当前：{visible ? "公开显示 — 入口可见，访客可访问" : "隐藏 — 入口不显示，仅管理员可预览"}
        </p>
      </section>

      <div className="hv-divider" />

      <CvEditor data={data} arraysJson={arraysJson} />
    </div>
  );
}
