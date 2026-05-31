"use client";

import { useState } from "react";
import { Bot, Send, TriangleAlert } from "lucide-react";

export function AskAIImpl({ slug }: { slug: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setAnswer("");
    setError(null);

    try {
      const res = await fetch("/api/posts/" + slug + "/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "请求失败 (" + res.status + ")");
      }

      if (!res.body) throw new Error("响应没有 body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setAnswer((prev) => prev + chunk);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hv-panel p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="hv-title inline-flex items-center gap-2 text-lg font-semibold tracking-normal">
          <Bot className="h-5 w-5 text-accent-soft" aria-hidden />
          问问 AI
        </h3>
        <span className="hv-chip text-xs">article scope</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-soft">
        AI 会基于这篇文章的内容回答你的问题。回答仅供参考，可能与作者本人观点不同。
      </p>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="比如：这套技术栈的成本怎样？为什么选 Postgres 而不是 SQLite？"
          rows={2}
          maxLength={500}
          disabled={loading}
          className="min-h-24 w-full border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-soft transition focus:border-border focus:outline-none disabled:opacity-60"
        />
        <div className="flex items-center justify-between text-xs text-muted-soft">
          <span>{question.length} / 500</span>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="hv-action min-h-9 px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" aria-hidden />
            {loading ? "思考中…" : "提问"}
          </button>
        </div>
      </form>

      {error ? (
        <p className="mt-3 flex items-start gap-2 border border-red-400/35 bg-red-500/10 p-3 text-sm text-red-100">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}

      {answer ? (
        <div className="mt-4 border border-border bg-card p-4">
          <p className="hv-kicker mb-2">AI answer</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{answer}</p>
        </div>
      ) : null}
    </div>
  );
}
