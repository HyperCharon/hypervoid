"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

let mermaidInitialized = false;
let mermaidInitializedTheme = "";

export function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(
    `mermaid-${crypto.randomUUID().slice(0, 8)}`,
  );
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "default";

  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        const m = await import("mermaid");
        const mermaid = m.default;
        if (!mermaidInitialized || mermaidInitializedTheme !== theme) {
          mermaid.initialize({
            startOnLoad: false,
            theme,
            securityLevel: "strict",
            fontFamily: "inherit",
          });
          mermaidInitialized = true;
          mermaidInitializedTheme = theme;
        }
        const { svg } = await mermaid.render(idRef.current, code);
        if (disposed || !containerRef.current) return;
        containerRef.current.innerHTML = svg;
        setError(null);
      } catch (e) {
        if (disposed) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      disposed = true;
    };
  }, [code, theme]);

  if (error) {
    return (
      <div className="not-prose my-6 rounded-xl border border-accent/40 bg-accent-glow p-4 text-xs">
        <p className="font-medium text-foreground">
          Mermaid 解析失败
        </p>
        <p className="mt-1 text-muted">{error}</p>
        <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-background p-2 font-mono text-[11px]">
          {code}
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="not-prose my-6 flex justify-center overflow-x-auto rounded-xl border border-border bg-card p-4"
      role="img"
      aria-label="Mermaid diagram"
    />
  );
}
