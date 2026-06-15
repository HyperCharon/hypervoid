import Link from "next/link";

type Defaults = {
  slot: "top" | "sidebar" | "article_top";
  message: string;
  link: string;
  linkText: string;
  startsAt: string;
  endsAt: string;
  priority: number;
  active: boolean;
};

const SLOT_OPTIONS: { value: Defaults["slot"]; label: string; hint: string }[] = [
  { value: "top", label: "顶部条带", hint: "全站可关闭的横条" },
  { value: "sidebar", label: "侧边栏", hint: "首页右栏卡片" },
  { value: "article_top", label: "文章顶部", hint: "每篇文章正文上方提示" },
];

export function AnnouncementForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (form: FormData) => void | Promise<void>;
  defaults: Defaults;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">显示位置</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {SLOT_OPTIONS.map((s) => (
            <label
              key={s.value}
              className="hv-panel flex cursor-pointer flex-col gap-0.5 p-3 transition has-[:checked]:border-accent/60 has-[:checked]:bg-accent/10"
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="slot"
                  value={s.value}
                  defaultChecked={defaults.slot === s.value}
                  required
                />
                <span className="font-medium">{s.label}</span>
              </span>
              <span className="text-xs text-muted">{s.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">正文 *</span>
        <textarea
          name="message"
          defaultValue={defaults.message}
          rows={3}
          required
          className="hv-input min-h-11 px-3 text-sm"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">链接（可选）</span>
          <input
            type="url"
            name="link"
            defaultValue={defaults.link}
            placeholder="https://..."
            className="hv-input min-h-11 px-3 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">链接按钮文字</span>
          <input
            type="text"
            name="linkText"
            defaultValue={defaults.linkText}
            placeholder="了解更多"
            className="hv-input min-h-11 px-3 text-sm"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">起始时间（可选）</span>
          <input
            type="datetime-local"
            name="startsAt"
            defaultValue={defaults.startsAt}
            className="hv-input min-h-11 px-3 text-sm"
          />
          <span className="text-[11px] text-muted">留空 = 立即生效</span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">结束时间（可选）</span>
          <input
            type="datetime-local"
            name="endsAt"
            defaultValue={defaults.endsAt}
            className="hv-input min-h-11 px-3 text-sm"
          />
          <span className="text-[11px] text-muted">留空 = 永久有效</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <span>优先级</span>
          <input
            type="number"
            name="priority"
            defaultValue={defaults.priority}
            className="hv-input w-24 px-2 py-1"
          />
          <span className="text-xs text-muted">数值越大越优先</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={defaults.active}
            className="h-4 w-4"
          />
          <span>启用</span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="hv-action hv-chip-strong px-5 text-sm font-medium"
        >
          {submitLabel}
        </button>
        <Link
          href="/admin/notes"
          className="hv-action px-4 text-sm"
        >
          取消
        </Link>
      </div>
    </form>
  );
}
