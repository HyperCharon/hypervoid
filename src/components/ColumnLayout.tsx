"use client";

import { Columns2, Rows3 } from "lucide-react";
import { useEffect, useState } from "react";

export function useColumnLayout(
  storageKey: string,
  initial: boolean = true,
): readonly [boolean, (v: boolean) => void] {
  const [twoCol, setTwoCol] = useState(initial);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) setTwoCol(saved === "1");
    } catch {
      // ignore
    }
  }, [storageKey]);

  function setLayout(v: boolean) {
    setTwoCol(v);
    try {
      localStorage.setItem(storageKey, v ? "1" : "0");
    } catch {
      // ignore
    }
  }

  return [twoCol, setLayout] as const;
}

export function ColumnToggleButton({
  twoCol,
  onChange,
}: {
  twoCol: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5">
      <button
        type="button"
        onClick={() => onChange(false)}
        aria-label="单列"
        aria-pressed={!twoCol}
        title="单列"
        className={`grid h-8 w-8 place-items-center rounded-md transition ${
          !twoCol
            ? "bg-accent/15 text-accent"
            : "text-muted-soft hover:bg-card-hover hover:text-foreground"
        }`}
      >
        <Rows3 className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        aria-label="双列"
        aria-pressed={twoCol}
        title="双列"
        className={`grid h-8 w-8 place-items-center rounded-md transition ${
          twoCol
            ? "bg-accent/15 text-accent"
            : "text-muted-soft hover:bg-card-hover hover:text-foreground"
        }`}
      >
        <Columns2 className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
