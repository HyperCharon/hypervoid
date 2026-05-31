"use client";

import { useRef, useState, type HTMLAttributes, type ReactNode } from "react";

type Props = HTMLAttributes<HTMLPreElement> & {
  "data-language"?: string;
  "data-filename"?: string;
  children?: ReactNode;
};

export function CodeBlock(props: Props) {
  const {
    "data-language": lang,
    "data-filename": filename,
    className,
    style,
    children,
    ...rest
  } = props;

  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  function copy() {
    const text = ref.current?.innerText ?? "";
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        /* clipboard blocked */
      });
  }

  const hasHeader = Boolean(filename || lang);

  return (
    <div className="code-panel not-prose group relative my-6 overflow-hidden rounded-2xl border">
      {hasHeader ? (
        <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[var(--code-header)] px-4 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span aria-hidden className="flex shrink-0 gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
            </span>
            {filename ? (
              <span className="truncate font-mono text-xs text-slate-200">
                {filename}
              </span>
            ) : null}
            {lang ? (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-xs uppercase tracking-wider text-accent">
                {lang}
              </span>
            ) : null}
          </div>
          <CopyButton copied={copied} onClick={copy} />
        </div>
      ) : (
        <div className="absolute right-2 top-2 z-10 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          <CopyButton copied={copied} onClick={copy} compact />
        </div>
      )}
      <pre
        ref={ref}
        className={`${className ?? ""} overflow-x-auto px-4 py-4 text-sm leading-relaxed`}
        style={style}
        {...rest}
      >
        {children}
      </pre>
    </div>
  );
}

function CopyButton({
  copied,
  onClick,
  compact = false,
}: {
  copied: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? "已复制" : "复制代码"}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition ${
        compact ? "border border-border bg-card/80 backdrop-blur" : ""
      } ${
        copied
          ? "text-primary"
          : "text-muted hover:bg-primary/10 hover:text-primary"
      }`}
    >
      {copied ? (
        <>
          <svg
            aria-hidden
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>已复制</span>
        </>
      ) : (
        <>
          <svg
            aria-hidden
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>复制</span>
        </>
      )}
    </button>
  );
}
