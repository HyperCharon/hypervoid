"use client";

import { useMemo, type CSSProperties } from "react";

interface GradualBlurProps {
  /** Blur direction */
  position?: "bottom" | "top" | "left" | "right";
  /** Blur intensity multiplier (1 = subtle, 2 = medium, 3 = strong) */
  intensity?: number;
  /** Height/width of the blur zone */
  height?: string;
  /** Number of stacked blur layers (more = smoother) */
  layers?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Gradual blur overlay — inspired by reactbits.dev/Backgrounds/GradualBlur
 *
 * Stacks multiple backdrop-filter layers with progressive blur values
 * and gradient masks to create a smooth, organic blur falloff.
 */
export function GradualBlur({
  position = "bottom",
  intensity = 1,
  height = "6rem",
  layers = 3,
  className = "",
  style,
}: GradualBlurProps) {
  const isVertical = position === "bottom" || position === "top";

  const layerStyles = useMemo(() => {
    return Array.from({ length: layers }, (_, i) => {
      const fraction = (i + 1) / layers;
      const blur = intensity * fraction * 4;
      const fadeStart = fraction * 100 * 0.4;
      const fadeEnd = fraction * 100;

      let maskDir: string;
      switch (position) {
        case "bottom":
          maskDir = "to top";
          break;
        case "top":
          maskDir = "to bottom";
          break;
        case "left":
          maskDir = "to right";
          break;
        case "right":
          maskDir = "to left";
          break;
      }

      return {
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        maskImage: `linear-gradient(${maskDir}, black ${fadeStart}%, transparent ${fadeEnd}%)`,
        WebkitMaskImage: `linear-gradient(${maskDir}, black ${fadeStart}%, transparent ${fadeEnd}%)`,
      } satisfies CSSProperties;
    });
  }, [layers, intensity, position]);

  const positionStyle: CSSProperties = isVertical
    ? { left: 0, right: 0, height }
    : { top: 0, bottom: 0, width: height };

  const anchorStyle: CSSProperties =
    position === "bottom"
      ? { bottom: 0 }
      : position === "top"
        ? { top: 0 }
        : position === "left"
          ? { left: 0 }
          : { right: 0 };

  return (
    <div
      className={`pointer-events-none absolute z-10 ${className}`}
      style={{ ...positionStyle, ...anchorStyle, ...style }}
    >
      {layerStyles.map((ls, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={ls}
        />
      ))}
    </div>
  );
}
