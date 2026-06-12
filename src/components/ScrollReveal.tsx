"use client";

import { useRef, useEffect, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Animation variant */
  variant?: "fade-up" | "fade-in" | "slide-left" | "slide-right" | "scale-up" | "blur-in";
  /** Delay in ms */
  delay?: number;
  /** Duration in ms */
  duration?: number;
  /** Threshold for triggering (0-1) */
  threshold?: number;
  /** Whether to animate only once */
  once?: boolean;
}

const VARIANT_STYLES: Record<string, { from: string; to: string }> = {
  "fade-up": {
    from: "opacity:0;transform:translateY(24px)",
    to: "opacity:1;transform:translateY(0)",
  },
  "fade-in": {
    from: "opacity:0",
    to: "opacity:1",
  },
  "slide-left": {
    from: "opacity:0;transform:translateX(32px)",
    to: "opacity:1;transform:translateX(0)",
  },
  "slide-right": {
    from: "opacity:0;transform:translateX(-32px)",
    to: "opacity:1;transform:translateX(0)",
  },
  "scale-up": {
    from: "opacity:0;transform:scale(0.95)",
    to: "opacity:1;transform:scale(1)",
  },
  "blur-in": {
    from: "opacity:0;filter:blur(8px)",
    to: "opacity:1;filter:blur(0)",
  },
};

export function ScrollReveal({
  children,
  className = "",
  variant = "fade-up",
  delay = 0,
  duration = 600,
  threshold = 0.15,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const style = VARIANT_STYLES[variant] || VARIANT_STYLES["fade-up"];
    el.style.cssText = style.from + ";transition:none;will-change:transform,opacity,filter";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.style.transition = `all ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
            el.style.cssText = style.to;
            // Release GPU memory after animation completes
            const cleanup = () => {
              el.style.willChange = "auto";
              el.removeEventListener("transitionend", cleanup);
            };
            el.addEventListener("transitionend", cleanup, { once: true });
          }, delay);
          if (once) observer.unobserve(el);
        } else if (!once) {
          el.style.cssText = style.from + ";transition:none";
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [variant, delay, duration, threshold, once]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
