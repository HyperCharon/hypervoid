import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import {
  AI_MODELS,
  BUILTIN_PROVIDERS,
  getActiveAiModel,
  isProviderConfigured,
  providerKeyHint,
  type AiProvider,
} from "@/lib/ai-config";
import {
  listCustomModels,
  customDisplayId,
  maskCustomKey,
} from "@/lib/ai-custom-models";
import {
  getProviderQuota,
  getTodayUsage,
} from "@/lib/ai-quota";
import {
  updateModelAction,
  updateQuotaAction,
  saveCustomModelAction,
  deleteCustomModelAction,
} from "./actions";

export const metadata: Metadata = {
  title: "AI 配置",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ENV_NAME: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
};

const PROVIDER_DOCS: Record<string, { url: string; hint: string }> = {
  openai: {
    url: "https://platform.openai.com/api-keys",
    hint: "在 platform.openai.com 创建 Key。内置 OpenAI 模型走官方 Responses API。",
  },
  anthropic: {
    url: "https://console.anthropic.com/",
    hint: "在 console.anthropic.com 创建 Key,需要绑卡。",
  },
  deepseek: {
    url: "https://platform.deepseek.com/",
    hint: "在 platform.deepseek.com 创建 Key,支付宝/微信充值。",
  },
};

function fmtNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export default async function AdminAiPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const current = await getActiveAiModel();
  const customRows = await listCustomModels();
  const usage = await getTodayUsage();
  const usageByProvider = new Map(usage.map((u) => [u.provider, u]));

  // Quota config covers built-in providers + each enabled custom model.
  const quotaProviders: { key: string; label: string }[] = [
    ...BUILTIN_PROVIDERS.map((p) => ({ key: p.id, label: p.label })),
    ...customRows.map((c) => ({ key: c.id, label: c.label })),
  ];
  const quotas: Record<string, number> = {};
  for (const p of quotaProviders) {
    quotas[p.key] = await getProviderQuota(p.key);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="hv-panel-sci p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-accent/60 pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-10 w-10 border-r-2 border-b-2 border-accent/60 pointer-events-none" />

        <AdminBackLink href="/admin" label="后台" />
        <p className="hv-kicker mt-4 uppercase">AI_CONTROL_PLANE</p>
        <h1 className="hv-title mt-1 font-mono text-2xl font-semibold tracking-wider uppercase">AI 配置</h1>
      </header>

      <p className="text-sm text-muted">
        所有 AI 功能(文章摘要、标签建议、AskAI、康娜聊天、写作助手)共用这里选的模型。
        当前生效:{" "}
        <span className="font-mono text-foreground uppercase">{current.label}</span>{" "}
        <span className="text-[10px] text-muted">({current.upstreamId})</span>
      </p>

      <section className="grid gap-3 sm:grid-cols-2">
        {BUILTIN_PROVIDERS.map((p) => {
          const ok = isProviderConfigured(p.id);
          const masked = providerKeyHint(p.id);
          return (
            <div
              key={p.id}
              className={`hv-panel-sci p-5 ${
                current.provider === p.id
                  ? "border-accent/55 bg-accent/10"
                  : "border-accent/16 bg-accent/6"
              }`}
            >
              <header className="mb-2 flex items-center justify-between gap-3">
                <h2 className="font-mono text-sm font-semibold tracking-wider uppercase">
                  {p.label}
                </h2>
                <span
                  className={`px-2 py-0.5 text-[10px] font-medium font-mono uppercase ${
                    ok
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-red-500/15 text-red-700 dark:text-red-300"
                  }`}
                >
                  {ok ? "READY" : "NOT_SET"}
                </span>
              </header>
              <p className="font-mono text-[11px] text-muted">{masked}</p>
              <p className="mt-2 text-xs text-muted">
                环境变量:{" "}
                <code className="rounded bg-background px-1 py-0.5 font-mono text-[10px]">
                  {ENV_NAME[p.id]}
                </code>
              </p>
              <p className="mt-1 text-xs text-muted">
                {PROVIDER_DOCS[p.id].hint}{" "}
                <a
                  href={PROVIDER_DOCS[p.id].url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-foreground hover:underline"
                >
                  控制台 ↗
                </a>
              </p>
            </div>
          );
        })}
      </section>

      <section className="hv-panel p-5">
        <h2 className="mb-1 text-sm font-semibold tracking-tight">
          今日用量(本地时区 0 点重置)
        </h2>
        <p className="mb-4 text-xs text-muted">
          每次 AI 请求结束后会自动累加 token。超过限额的 provider 后续请求会被直接拒绝。
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {quotaProviders.map((p) => {
            const u = usageByProvider.get(p.key);
            const used = u?.totalTokens ?? 0;
            const limit = quotas[p.key] ?? 0;
            const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
            const over = limit > 0 && used >= limit;
            const near = limit > 0 && used >= limit * 0.8 && !over;
            return (
              <div
                key={p.key}
                className={`border p-3 ${
                  over
                    ? "border-red-500/50 bg-red-500/5"
                    : near
                    ? "border-amber-500/50 bg-amber-500/5"
                    : "border-border bg-black/20"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">{p.label}</span>
                  <span className="font-mono text-[10px] text-muted">
                    {u?.requests ?? 0} 次
                  </span>
                </div>
                <div className="mt-1 font-mono text-xs">
                  <span className={over ? "text-red-600 dark:text-red-400" : "text-foreground"}>
                    {fmtNumber(used)}
                  </span>{" "}
                  <span className="text-muted">/</span>{" "}
                  <span className="text-muted">{limit > 0 ? fmtNumber(limit) : "∞"}</span>{" "}
                  <span className="text-muted">tokens</span>
                </div>
                {limit > 0 ? (
                  <div className="mt-2 h-1.5 overflow-hidden  bg-muted/12">
                    <div
                      className={`h-full transition-all ${
                        over
                          ? "bg-red-500"
                          : near
                          ? "bg-amber-500"
                          : "bg-accent"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                ) : null}
                {u ? (
                  <div className="mt-1 text-[10px] text-muted">
                    in {fmtNumber(u.promptTokens)} · out {fmtNumber(u.completionTokens)}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="hv-panel p-5">
        <h2 className="mb-1 text-sm font-semibold tracking-tight">每日 token 限额</h2>
        <p className="mb-4 text-xs text-muted">
          0 表示不限。限额累加到 token 总数(prompt+completion),达到后当日所有该 provider 的请求会被拒绝。
        </p>
        <form action={updateQuotaAction} className="flex flex-col gap-3">
          <input
            type="hidden"
            name="providers"
            value={quotaProviders.map((p) => p.key).join(",")}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            {quotaProviders.map((p) => (
              <label
                key={p.key}
                className="flex flex-col gap-1 border border-border bg-black/20 p-3"
              >
                <span className="text-xs font-medium">{p.label}</span>
                <input
                  type="number"
                  name={`quota.${p.key}`}
                  defaultValue={quotas[p.key] ?? 0}
                  min={0}
                  step={1000}
                  className="w-full rounded-md border border-border bg-accent-soft/6 px-2 py-1 font-mono text-sm"
                  placeholder="0 = 不限"
                />
                <span className="text-[10px] text-muted">tokens / 天</span>
              </label>
            ))}
          </div>
          <button
            type="submit"
            className="self-start hv-action hv-chip-strong px-4 text-sm font-medium"
          >
            保存限额
          </button>
        </form>
      </section>

      <section className="hv-panel p-5">
        <h2 className="mb-1 text-sm font-semibold tracking-tight">模型选择</h2>
        <p className="mb-4 text-xs text-muted">
          换模型立即生效——下一次请求即用新模型。Pro 类模型更贵更慢但更聪明,Flash 类更快更便宜。
        </p>
        <form action={updateModelAction} className="flex flex-col gap-3">
          {(["openai", "deepseek", "anthropic"] as AiProvider[]).map((provider) => {
            const models = AI_MODELS.filter((m) => m.provider === provider);
            const providerOk = isProviderConfigured(provider);
            return (
              <div key={provider} className="flex flex-col gap-2">
                <p className="text-[10px] uppercase tracking-widest text-muted">
                  {BUILTIN_PROVIDERS.find((p) => p.id === provider)?.label}
                  {!providerOk ? (
                    <span className="ml-2 normal-case tracking-normal text-red-500">
                      ({ENV_NAME[provider]} 未配置 — 选了也不能用)
                    </span>
                  ) : null}
                </p>
                {models.map((m) => {
                  const active = m.id === current.id;
                  return (
                    <label
                      key={m.id}
                      className={`flex cursor-pointer items-start gap-3 border p-3 transition ${
                        active
                          ? "border-accent-soft/55 bg-accent-soft/10"
                          : "border-border bg-black/20 hover:border-accent/40"
                      } ${!providerOk ? "opacity-60" : ""}`}
                    >
                      <input
                        type="radio"
                        name="model"
                        value={m.id}
                        defaultChecked={active}
                        className="mt-1 accent-accent-soft"
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                          {m.label}
                          <code className="rounded bg-black/25 px-1.5 py-0.5 font-mono text-[10px] text-muted">
                            {m.upstreamId}
                          </code>
                        </span>
                        <span className="text-xs text-muted">{m.hint}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            );
          })}

          {customRows.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] uppercase tracking-widest text-muted">
                自定义模型({customRows.length})
              </p>
              {customRows.map((row) => {
                const active = row.id === current.id;
                return (
                  <label
                    key={row.id}
                    className={`flex cursor-pointer items-start gap-3 border p-3 transition ${
                      active
                        ? "border-accent-soft/55 bg-accent-soft/10"
                        : "border-border bg-black/20 hover:border-accent/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="model"
                      value={row.id}
                      defaultChecked={active}
                      className="mt-1 accent-accent-soft"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        {row.label}
                        <code className="rounded bg-black/25 px-1.5 py-0.5 font-mono text-[10px] text-muted">
                          {row.upstreamId}
                        </code>
                        <span className=" bg-muted/12 px-1.5 py-0.5 text-[9px] uppercase tracking-widest">
                          {row.protocol}
                        </span>
                      </span>
                      <span className="text-xs text-muted">
                        {row.hint || row.baseUrl}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          ) : null}

          <button
            type="submit"
            className="self-start hv-action hv-chip-strong px-4 text-sm font-medium"
          >
            保存模型
          </button>
        </form>
      </section>

      <section className="hv-panel p-5">
        <header className="mb-1 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-tight">
            自定义模型管理({customRows.length})
          </h2>
          <span className="text-[10px] text-muted">
            OpenAI 兼容 / Anthropic 兼容两种协议
          </span>
        </header>
        <p className="mb-3 text-xs text-muted">
          按需添加多个,到上面的「模型选择」单选要启用的那个。删除不影响其它模型,正在使用的那个删了之后会自动回退到默认 DeepSeek Flash。
        </p>

        {customRows.length > 0 ? (
          <ul className="mb-4 flex flex-col gap-2">
            {customRows.map((row) => {
              const active = row.id === current.id;
              return (
                <li
                  key={row.id}
                  className={`flex items-start gap-3 border p-3 text-xs ${
                    active
                      ? "border-accent-soft/55 bg-accent-soft/10"
                      : "border-border bg-black/20"
                  }`}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="text-sm font-medium">
                      {row.label}{" "}
                      <code className="rounded bg-black/25 px-1 py-0.5 font-mono text-[10px] text-muted">
                        {customDisplayId(row.id)}
                      </code>
                      {active ? (
                        <span className="ml-2  bg-accent/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-widest text-foreground">
                          当前启用
                        </span>
                      ) : null}
                    </p>
                    <p className="font-mono text-[10px] text-muted">
                      {row.protocol} · {row.baseUrl} · {row.upstreamId}
                    </p>
                    <p className="font-mono text-[10px] text-muted">
                      key: {maskCustomKey(row.apiKey)}
                    </p>
                  </div>
                  <form action={deleteCustomModelAction}>
                    <input type="hidden" name="id" value={row.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-red-500/40 px-2 py-1 text-[10px] font-medium text-red-600 transition hover:bg-red-500/10 dark:text-red-300"
                    >
                      删除
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mb-4 text-xs text-muted">还没有自定义模型。下面填表新增。</p>
        )}

        <form
          action={saveCustomModelAction}
          className="grid gap-3 hv-panel border-dashed p-4 sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium">id (字母数字/-,2-40 位)</span>
            <input
              name="id"
              required
              placeholder="openrouter-sonnet"
              className="rounded-md border border-border bg-black/20 px-2 py-1 font-mono text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium">显示名称</span>
            <input
              name="label"
              required
              placeholder="OpenRouter · Claude 3.5 Sonnet"
              className="rounded-md border border-border bg-black/20 px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium">协议</span>
            <select
              name="protocol"
              defaultValue="openai"
              className="rounded-md border border-border bg-black/20 px-2 py-1 text-sm"
            >
              <option value="openai">openai (兼容 /chat/completions)</option>
              <option value="anthropic">anthropic (兼容 /v1/messages)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium">Base URL</span>
            <input
              name="baseUrl"
              required
              placeholder="https://api.xiaomimimo.com/v1 或完整 /chat/completions"
              className="rounded-md border border-border bg-black/20 px-2 py-1 font-mono text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium">Model ID (上游识别字符串)</span>
            <input
              name="upstreamId"
              required
              placeholder="anthropic/claude-3.5-sonnet"
              className="rounded-md border border-border bg-black/20 px-2 py-1 font-mono text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium">API Key</span>
            <input
              name="apiKey"
              required
              type="password"
              placeholder="sk-or-..."
              className="rounded-md border border-border bg-black/20 px-2 py-1 font-mono text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs sm:col-span-2">
            <span className="font-medium">备注 (可选,显示在模型选择列表)</span>
            <input
              name="hint"
              placeholder="OpenRouter 的 Sonnet — 国内可达"
              className="rounded-md border border-border bg-black/20 px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs sm:col-span-2">
            <span className="font-medium">额外 Headers (可选 JSON 对象)</span>
            <input
              name="extraHeaders"
              placeholder={'{"HTTP-Referer": "https://hypervoid.top", "X-Title": "Hypervoid"}'}
              className="rounded-md border border-border bg-black/20 px-2 py-1 font-mono text-[11px]"
            />
            <span className="text-[10px] text-muted">
              OpenRouter 推荐填 HTTP-Referer + X-Title；MiMo 通常留空。MiMo 的 Model ID 填 mimo-v2.5-pro，不要把 [1M] 说明写进模型名。
            </span>
          </label>
          <button
            type="submit"
            className="self-start hv-action hv-chip-strong px-4 text-sm font-medium sm:col-span-2"
          >
            添加 / 更新自定义模型
          </button>
        </form>
      </section>

      <section className="hv-panel p-5">
        <h2 className="mb-3 text-sm font-semibold tracking-tight">使用范围</h2>
        <ul className="grid gap-2 sm:grid-cols-2 text-xs">
          <FeatureCard title="文章摘要" hint="发布时自动生成 / 编辑页手动重生" />
          <FeatureCard title="标签建议" hint="编辑页「AI 建议标签」按钮" />
          <FeatureCard title="AskAI" hint="文章页访客提问,按文章内容回答" />
          <FeatureCard
            title="康娜聊天"
            hint="看板娘对话(已注入 README/手册,会给出路由链接)"
          />
          <FeatureCard
            title="写作助手"
            hint="编辑页大纲 / 润色 / 起标题 / TL;DR"
          />
        </ul>
      </section>
    </div>
  );
}

function FeatureCard({ title, hint }: { title: string; hint: string }) {
  return (
    <li className="border border-border bg-black/20 p-3">
      <p className="font-medium">{title}</p>
      <p className="mt-0.5 text-muted">{hint}</p>
    </li>
  );
}
