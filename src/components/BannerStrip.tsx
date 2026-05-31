"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useSettings } from "@/components/SettingsProvider";
import { siteConfig } from "@/lib/site-config";

function AcgCarouselInline({ wallpapers }: { wallpapers: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (wallpapers.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % wallpapers.length);
    }, 9000);
    return () => window.clearInterval(id);
  }, [wallpapers.length]);

  return (
    <>
      {wallpapers.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          priority={i === 0}
          loading={i === 0 ? "eager" : "lazy"}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms] ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background"
      />
    </>
  );
}

export function BannerStrip() {
  const { background } = useSettings();

  if (background === "plain") return null;

  const stripClass =
    "relative w-full h-[44vh] overflow-hidden pointer-events-none";

  if (background === "acg") {
    if (siteConfig.acgWallpapers.length === 0) {
      return (
        <div className={`${stripClass} flex items-center justify-center bg-card/40`}>
          <p className="rounded-xl border border-dashed border-border bg-card px-4 py-2 text-xs text-muted">
            ACG 轮播未配置壁纸 — 在 src/lib/site-config.ts 的 acgWallpapers 数组填入图片路径
          </p>
        </div>
      );
    }
    return (
      <div className={stripClass}>
        <AcgCarouselInline wallpapers={siteConfig.acgWallpapers} />
      </div>
    );
  }

  if (background === "cosmic" || background === "particles") {
    return (
      <div className={stripClass}>
        <BannerParticles density={background === "particles" ? "dense" : "normal"} />
      </div>
    );
  }

  if (background === "cyberpunk") {
    return (
      <div className={stripClass}>
        <Image
          src="/wallpapers/cyberpunk.webp"
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          priority
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,200,255,0.12),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(200,0,200,0.08),transparent_50%)]"
        />
      </div>
    );
  }

  if (background === "medieval") {
    return (
      <div className={stripClass}>
        <Image
          src="/wallpapers/medieval.webp"
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          priority
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(40,28,12,0.2),rgba(20,12,4,0.45))] mix-blend-multiply"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-background/0 via-transparent to-background"
        />
      </div>
    );
  }
  return null;
}

import { useEffect as useFx, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  z: number;
  size: number;
  vx: number;
  vy: number;
};

function BannerParticles({ density }: { density: "normal" | "dense" }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { resolvedTheme } = useTheme();

  useFx(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas) return;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const isDark = resolvedTheme === "dark";
    const base = isDark
      ? { count: 90, baseSpeed: 0.06, sizeMin: 0.4, sizeMax: 1.6, baseOpacity: 0.22, color: "255, 255, 255" }
      : { count: 32, baseSpeed: 0.02, sizeMin: 1.2, sizeMax: 3.2, baseOpacity: 0.12, color: "99, 102, 241" };
    const config =
      density === "dense"
        ? { ...base, count: Math.round(base.count * 1.8), baseSpeed: base.baseSpeed * 0.55, baseOpacity: base.baseOpacity * 0.8 }
        : base;

    const particles: Particle[] = Array.from({ length: config.count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 0.7 + 0.3,
      size: Math.random() * (config.sizeMax - config.sizeMin) + config.sizeMin,
      vx: (Math.random() - 0.5) * 0.1,
      vy: config.baseSpeed * (Math.random() * 0.5 + 0.5),
    }));

    let mounted = true;
    let raf = 0;
    function draw() {
      if (!mounted || !ctx) return;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy * p.z;
        if (p.y > height + 4) { p.y = -4; p.x = Math.random() * width; }
        if (p.x < -4) p.x = width + 4;
        else if (p.x > width + 4) p.x = -4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.z, 0, Math.PI * 2);
        const alpha = config.baseOpacity * p.z + 0.05;
        ctx.fillStyle = `rgba(${config.color}, ${alpha})`;
        if (!isDark) { ctx.shadowColor = `rgba(${config.color}, ${alpha * 0.6})`; ctx.shadowBlur = 10; }
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(draw);
    }
    draw();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    return () => { mounted = false; cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, [resolvedTheme, density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
