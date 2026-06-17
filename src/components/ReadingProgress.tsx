"use client";

import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    function update() {
      ticking = false;
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        setProgress(0);
        return;
      }
      const p = Math.min(1, Math.max(0, scrollTop / docHeight));
      setProgress(p);
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, []);

  const pct = Math.round(progress * 100);
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5"
      >
        <div
          className="h-full origin-left bg-primary transition-transform duration-150 ease-out"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
      {pct > 2 ? (
        <span
          aria-hidden
          className="pointer-events-none fixed right-3 top-[68px] z-50 rounded-full border border-border/40 bg-card px-2 py-0.5 font-mono text-[11px] text-muted"
        >
          {pct}%
        </span>
      ) : null}
    </>
  );
}
