"use client";

import { useState, useTransition } from "react";
import { useT } from "@/components/LocaleProvider";

export function SubscribeForm({
  variant = "default",
}: {
  variant?: "default" | "compact";
}) {
  const t = useT();
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<
    { type: "ok" | "error"; text: string } | null
  >(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: value }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (res.ok && data.ok) {
          setMessage({
            type: "ok",
            text: t.subscribe.success,
          });
          setEmail("");
        } else {
          setMessage({
            type: "error",
            text: data.error ?? `${t.subscribe.error} (${res.status})`,
          });
        }
      } catch (e) {
        setMessage({ type: "error", text: (e as Error).message });
      }
    });
  };

  const isCompact = variant === "compact";

  const form = (
    <form
      onSubmit={onSubmit}
      className="flex min-w-0 flex-col gap-1.5 sm:flex-row"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="hv-input min-h-11 min-w-0 flex-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-soft transition focus:border-accent/50 focus:bg-card focus:outline-none focus:ring-2 focus:ring-accent-glow"
        aria-label={t.subscribe.emailLabel}
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-accent/40 bg-accent/10 px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-accent shadow-[0_0_16px_var(--accent-glow)] transition hover:border-accent/60 hover:bg-accent/20 hover:text-accent hover:shadow-[0_0_24px_var(--accent-glow)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[0_0_16px_var(--accent-glow)]"
      >
        {pending ? t.common.submitting : t.common.subscribe}
        {!pending ? (
          <svg
            aria-hidden
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M13 5l7 7-7 7" />
          </svg>
        ) : null}
      </button>
    </form>
  );

  if (isCompact) return form;

  return (
    <div className="hv-panel-sci group relative overflow-hidden p-3 sm:p-3.5">
      <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,0.85fr)_minmax(22rem,1.15fr)] md:items-end">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            <h3 className="font-mono text-sm font-semibold uppercase tracking-widest text-accent">
              Subscribe_Updates
            </h3>
          </div>
          <p className="mt-1.5 text-sm leading-snug text-muted">
            {t.subscribe.description}
          </p>
        </div>
        {form}
      </div>

      {message ? (
        <p
          className={`mt-2 text-sm ${
            message.type === "ok"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
