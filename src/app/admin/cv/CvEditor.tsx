"use client";

import { useActionState } from "react";
import { saveCvAction, type CvActionState } from "./actions";
import type { Bi, CvData } from "@/lib/cv-data";

const initial: CvActionState = { ok: false };

function BiField({
  label,
  name,
  value,
  textarea,
}: {
  label: string;
  name: string;
  value: Bi;
  textarea?: boolean;
}) {
  const cls =
    "hv-input w-full px-3 py-2 text-sm";
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-xs font-medium uppercase text-foreground">{label}</span>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase text-muted">中文</span>
          {textarea ? (
            <textarea name={`${name}.zh`} defaultValue={value.zh} rows={3} className={cls} />
          ) : (
            <input name={`${name}.zh`} type="text" defaultValue={value.zh} className={cls} />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase text-muted">EN</span>
          {textarea ? (
            <textarea name={`${name}.en`} defaultValue={value.en} rows={3} className={cls} />
          ) : (
            <input name={`${name}.en`} type="text" defaultValue={value.en} className={cls} />
          )}
        </div>
      </div>
    </div>
  );
}

export function CvEditor({ data, arraysJson }: { data: CvData; arraysJson: string }) {
  const [state, action, pending] = useActionState(saveCvAction, initial);
  const id = data.identity;

  return (
    <form action={action} className="flex flex-col gap-5">
      <section className="flex flex-col gap-4">
        <h2 className="hv-title font-mono text-lg font-semibold uppercase tracking-wider">IDENTITY</h2>
        <BiField label="姓名 / Name" name="identity.name" value={id.name} />
        <BiField label="头衔 / Role" name="identity.role" value={id.role} />
        <BiField label="标语 / Tagline" name="identity.tagline" value={id.tagline} textarea />
        <BiField label="地点 / Location" name="identity.location" value={id.location} />
        <BiField label="状态 / Availability" name="identity.available" value={id.available} />
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs font-medium uppercase text-foreground">头像路径 / Avatar</span>
          <input
            name="identity.avatar"
            type="text"
            defaultValue={id.avatar}
            placeholder="/avatar.jpg"
            className="hv-input w-full px-3 py-2 text-sm"
          />
        </label>
      </section>

      <div className="hv-divider" />

      <section className="flex flex-col gap-4">
        <h2 className="hv-title font-mono text-lg font-semibold uppercase tracking-wider">SUMMARY</h2>
        <BiField label="简介 / Summary" name="summary" value={data.summary} textarea />
      </section>

      <div className="hv-divider" />

      <section className="flex flex-col gap-3">
        <h2 className="hv-title font-mono text-lg font-semibold uppercase tracking-wider">SECTIONS_JSON</h2>
        <p className="text-xs text-muted">
          技能、经历、项目、教育、联系方式、数据这些重复块用 JSON 编辑。顶层对象需含{" "}
          <code className="rounded bg-foreground/5 px-1 py-0.5">stats, skills, experience, projects, education, contacts</code>{" "}
          六个数组。每个文本字段都是 <code className="rounded bg-foreground/5 px-1 py-0.5">{`{ "zh": "", "en": "" }`}</code>。
        </p>
        <textarea
          name="arrays_json"
          defaultValue={arraysJson}
          rows={22}
          spellCheck={false}
          className="hv-input w-full px-3 py-2 font-mono text-xs leading-relaxed"
        />
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="hv-action px-5 py-2 font-mono text-sm font-medium uppercase  hover:shadow-[0_0_20px_var(--accent-glow)] disabled:opacity-50"
        >
          {pending ? "保存中…" : "保存简历"}
        </button>
        {state.error ? (
          <span className="font-mono text-xs text-red-400">{state.error}</span>
        ) : state.ok ? (
          <span className="font-mono text-xs text-emerald-400">已保存 ✓</span>
        ) : null}
      </div>
    </form>
  );
}
