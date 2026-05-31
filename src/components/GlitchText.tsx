"use client";

import type { CSSProperties, ReactNode } from "react";

interface GlitchTextProps {
  children: ReactNode;
  speed?: number;
  enableShadows?: boolean;
  enableOnHover?: boolean;
  className?: string;
  bgColor?: string;
}

interface GlitchCSSProperties extends CSSProperties {
  "--after-duration": string;
  "--before-duration": string;
  "--after-shadow": string;
  "--before-shadow": string;
  "--glitch-bg": string;
}

export function GlitchText({
  children,
  speed = 0.5,
  enableShadows = true,
  enableOnHover = false,
  className = "",
  bgColor = "var(--glitch-bg)",
}: GlitchTextProps) {
  const inlineStyles: GlitchCSSProperties = {
    "--after-duration": `${speed * 3}s`,
    "--before-duration": `${speed * 2}s`,
    "--after-shadow": enableShadows ? "-5px 0 var(--glitch-pink)" : "none",
    "--before-shadow": enableShadows ? "5px 0 var(--glitch-violet)" : "none",
    "--glitch-bg": bgColor,
  };

  const text = typeof children === "string" ? children : "";

  const baseClasses =
    "relative mx-auto select-none cursor-pointer font-black";

  const pseudoClasses = !enableOnHover
    ? "hv-glitch-active"
    : "hv-glitch-hover";

  return (
    <div
      style={inlineStyles}
      data-text={text}
      className={`${baseClasses} ${pseudoClasses} ${className}`}
    >
      {children}
    </div>
  );
}
