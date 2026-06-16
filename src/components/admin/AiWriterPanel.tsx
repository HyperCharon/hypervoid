"use client";

import { useState, useTransition } from "react";
import { Copy, Sparkles } from "lucide-react";
import {
  generateOutlineAction,
  generateTldrAction,
  polishTextAction,
  suggestTitlesAction,
} from "@/app/admin/posts/actions";

type Mode = "outline" | "polish" | "titles" | "tldr";

const MODE_LABEL: Record<Mode, string> = {
  outline: "生成大纲",
  polish: "润色段落",
  titles: "建议标题",
  tldr: "一句 TL;DR",
};

const MODE_HINT: Record<Mode, string> = {
  outline: "基于当前标题（与已写内容）输出 markdown 大纲",
  polish: "把下面输入框里的段落润色得更通顺",
  titles: "扫一遍正文，给 3-5 个候选标题",
  tldr: "整篇浓缩成一句不超过 40 字",
};

type Output =
  | { kind: "text"; value: string }
  | { kind: "list"; values: string[] }
  | { kind: "error"; value: string };

export function AiWriterPanel() {
  const [mode, setMode] = useState<Mode>("outline");
  const [polishInput, setPolishInput] = useState("");
  const [output, setOutput] = useState<Output | null>(null);
  const [pending, startTransition] = useTransition();

  function readEditor(): { title: string; content: string } {
    if (typeof document === "undefined") return { title: "", content: "" };
    const titleEl = document.querySelector<HTMLInputElement>('input[name="title"]');
    const contentEl = document.querySelector<HTMLTextAreaElement>('textarea[name="content"]');
    return { title: titleEl?.value ?? "", content: contentEl?.value ?? "" };
  }

  const run = () => {
    const { title, content } = readEditor();
    setOutput(null);
    startTransition(async () => {
      if (mode === "outline") {
        const r = await generateOutlineAction({ title, content });
        setOutput("error" in r ? { kind: "error", value: r.error } : { kind: "text", value: r.outline });
      } else if (mode === "polish") {
        const r = await polishTextAction(polishInput);
        setOutput("error" in r ? { kind: "error", value: r.error } : { kind: "text", value: r.text });
      } else if (mode === "titles") {
        const r = await suggestTitlesAction({ title, content });
        setOutput("error" in r ? { kind: "error", value: r.error } : { kind: "list", values: r.titles });
      } else {
        const r = await generateTldrAction({ title, content });
        setOutput("error" in r ? { kind: "error", value: r.error } : { kind: "text", value: r.tldr });
      }
    });
  };

  const copy = (text: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <section className="hv-panel p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="hv-title inline-flex items-center gap-2 text-sm font-semibold tracking-normal">
            <Sparkles className="h-4 w-4 text-accent" aria-hidden />
            AI 写作助手
          </p>
          <p className="mt-1 text-[10px] text-muted">
            从当前编辑器读标题 + 正文。模型在 <code>/admin/ai</code> 里切换。
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setOutput(null); }}
              className={"border px-2.5 py-1 text-xs transition " + (
                mode === m
                  ? "border-accent/45 bg-accent/12 text-accent"
                  : "border-border text-muted hover:border-accent/40 hover:text-foreground"
              )}
            >
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
      </header>

      <p className="mb-3 text-xs text-muted">{MODE_HINT[mode]}</p>

      {mode === "polish" ? (
        <textarea
          value={polishInput}
          onChange={(e) => setPolishInput(e.target.value)}
          rows={4}
          placeholder="把要润色的段落粘到这里…"
          maxLength={4000}
          className="hv-input mb-3 w-full px-3 py-2 text-sm"
        />
      ) : null}

      <div className="flex items-center gap-2">
        <button type="button" onClick={run} disabled={pending} className="hv-action min-h-8 px-3 text-xs font-medium disabled:opacity-50">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {pending ? "AI 思考中…" : "运行"}
        </button>
        {output && output.kind !== "error" ? (
          <button
            type="button"
            onClick={() => {
              if (output.kind === "text") copy(output.value);
              else if (output.kind === "list") copy(output.values.join("\n"));
            }}
            className="hv-action min-h-8 px-3 text-xs"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden />
            复制结果
          </button>
        ) : null}
      </div>

      {output ? (
        <div className="mt-3 border border-border bg-card p-3 text-sm leading-relaxed">
          {output.kind === "error" ? (
            <p className="text-red-300">{output.value}</p>
          ) : output.kind === "text" ? (
            <pre className="whitespace-pre-wrap break-words font-sans text-foreground">{output.value}</pre>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {output.values.map((t, i) => (
                <li key={i} className="flex items-center justify-between gap-2 border border-border bg-card px-2 py-1.5">
                  <span>{t}</span>
                  <button type="button" onClick={() => copy(t)} className="border border-border px-2 py-0.5 text-[10px] text-muted hover:border-accent/40 hover:text-foreground">
                    复制
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}
