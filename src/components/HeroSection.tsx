"use client";

import { useRef, useCallback, useEffect, useState, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useT } from "@/components/LocaleProvider";

/* ── Reveal ────────────────────────────────────────────────── */
function R({ children, d = 0, className = "" }: { children: ReactNode; d?: number; className?: string }) {
  return (
    <motion.div className={className}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: d, ease: [0.22, 1, 0.36, 1] }}
    >{children}</motion.div>
  );
}

/* ── Magnetic ──────────────────────────────────────────────── */
function Mag({ children, className = "", s = 0.15 }: { children: ReactNode; className?: string; s?: number }) {
  const r = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 20 });
  const sy = useSpring(y, { stiffness: 200, damping: 20 });
  const mv = useCallback((e: React.MouseEvent) => {
    const el = r.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    x.set((e.clientX - b.left - b.width / 2) * s);
    y.set((e.clientY - b.top - b.height / 2) * s);
  }, [x, y, s]);
  const lv = useCallback(() => { x.set(0); y.set(0); }, [x, y]);
  return <motion.div ref={r} style={{ x: sx, y: sy }} onMouseMove={mv} onMouseLeave={lv} className={className}>{children}</motion.div>;
}

/* ── Starfield Canvas (stars + constellations + comet + pulsar) ── */
function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let raf: number, w = 0, h = 0;
    const dpr = Math.min(devicePixelRatio || 1, 2);

    // Stars
    const STAR_COUNT = 160;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.2 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
      brightness: Math.random() * 0.5 + 0.3,
    }));

    // Cosmic dust (very fine, slow drift)
    const DUST_COUNT = 80;
    const dust = Array.from({ length: DUST_COUNT }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 0.4 + 0.1,
      vx: (Math.random() - 0.5) * 0.02,
      vy: (Math.random() - 0.5) * 0.015,
      alpha: Math.random() * 0.15 + 0.05,
    }));

    // Constellation connections (pairs of star indices, pre-computed)
    const CONSTELLATION_DIST = 0.15; // max distance in normalized coords
    const connections: [number, number][] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      for (let j = i + 1; j < STAR_COUNT; j++) {
        const dx = stars[i].x - stars[j].x;
        const dy = stars[i].y - stars[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < CONSTELLATION_DIST) {
          connections.push([i, j]);
        }
      }
    }

    // Satellite (ISS-like dot moving across sky)
    const satellite = { x: 0, y: 0.15, speed: 0.0003, active: false, lastSpawn: 0 };

    // Pulsars (stars that emit expanding rings)
    const pulsars = [
      { x: 0.15, y: 0.25, rings: [] as { r: number; alpha: number }[], last: 0 },
      { x: 0.82, y: 0.6, rings: [] as { r: number; alpha: number }[], last: 0 },
    ];

    // Comet
    interface Comet { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; headR: number; }
    const comets: Comet[] = [];
    let lastComet = 0;

    function spawnComet() {
      comets.push({
        x: Math.random() * w * 0.5,
        y: Math.random() * h * 0.2,
        vx: 1.5 + Math.random() * 1.5,
        vy: 0.4 + Math.random() * 0.3,
        life: 0,
        maxLife: 80 + Math.random() * 60,
        headR: 2 + Math.random() * 1.5,
      });
      lastComet = performance.now();
    }

    // Shooting stars
    interface Shooting { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; len: number; }
    const shooting: Shooting[] = [];
    let lastShoot = 0;

    function spawnShooting(now: number) {
      shooting.push({
        x: Math.random() * w * 0.7, y: Math.random() * h * 0.3,
        vx: 2.5 + Math.random() * 2, vy: 1 + Math.random() * 0.5,
        life: 0, maxLife: 40 + Math.random() * 30, len: 30 + Math.random() * 40,
      });
      lastShoot = now;
    }

    function resize() {
      const p = c!.parentElement;
      if (!p) return;
      w = p.offsetWidth;
      h = p.offsetHeight;
      if (w < 10 || h < 10) return;
      c!.width = w * dpr; c!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    requestAnimationFrame(() => resize());
    addEventListener("resize", resize);
    const ro = new ResizeObserver(() => resize());
    ro.observe(c!.parentElement!);

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      const now = performance.now();

      // ── Constellation lines ──
      ctx!.lineWidth = 0.4;
      for (const [i, j] of connections) {
        const a = (stars[i].brightness + stars[j].brightness) / 2 * 0.08;
        ctx!.strokeStyle = `rgba(150, 180, 255, ${a})`;
        ctx!.beginPath();
        ctx!.moveTo(stars[i].x * w, stars[i].y * h);
        ctx!.lineTo(stars[j].x * w, stars[j].y * h);
        ctx!.stroke();
      }

      // ── Stars ──
      for (const s of stars) {
        const alpha = s.brightness + Math.sin(now * s.twinkleSpeed + s.twinkleOffset) * 0.25;
        ctx!.beginPath();
        ctx!.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(200, 210, 255, ${Math.max(0, alpha)})`;
        ctx!.fill();
      }

      // ── Pulsars ──
      for (const pulsar of pulsars) {
        if (now - pulsar.last > 3000) {
          pulsar.rings.push({ r: 0, alpha: 0.4 });
          pulsar.last = now;
        }
        for (let i = pulsar.rings.length - 1; i >= 0; i--) {
          const ring = pulsar.rings[i];
          ring.r += 0.8;
          ring.alpha -= 0.004;
          if (ring.alpha <= 0) { pulsar.rings.splice(i, 1); continue; }
          ctx!.beginPath();
          ctx!.arc(pulsar.x * w, pulsar.y * h, ring.r, 0, Math.PI * 2);
          ctx!.strokeStyle = `rgba(100, 180, 255, ${ring.alpha})`;
          ctx!.lineWidth = 0.8;
          ctx!.stroke();
        }
        const pCore = 0.5 + Math.sin(now * 0.005 + pulsar.x * 10) * 0.3;
        ctx!.beginPath();
        ctx!.arc(pulsar.x * w, pulsar.y * h, 2, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(100, 180, 255, ${pCore})`;
        ctx!.fill();
      }

      // ── Cosmic dust ──
      for (const d of dust) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0) d.x = 1;
        if (d.x > 1) d.x = 0;
        if (d.y < 0) d.y = 1;
        if (d.y > 1) d.y = 0;
        ctx!.beginPath();
        ctx!.arc(d.x * w, d.y * h, d.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(180, 200, 255, ${d.alpha})`;
        ctx!.fill();
      }

      // ── Comet ──
      if (now - lastComet > 8000 + Math.random() * 12000) spawnComet();
      for (let i = comets.length - 1; i >= 0; i--) {
        const cm = comets[i];
        cm.life++;
        cm.x += cm.vx;
        cm.y += cm.vy;
        const p = cm.life / cm.maxLife;
        const alpha = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;
        if (cm.life > cm.maxLife) { comets.splice(i, 1); continue; }

        // Tail
        const tailLen = 80;
        const tailX = cm.x - cm.vx * tailLen / 3;
        const tailY = cm.y - cm.vy * tailLen / 3;
        const grad = ctx!.createLinearGradient(tailX, tailY, cm.x, cm.y);
        grad.addColorStop(0, `rgba(180, 200, 255, 0)`);
        grad.addColorStop(0.7, `rgba(180, 200, 255, ${alpha * 0.15})`);
        grad.addColorStop(1, `rgba(200, 220, 255, ${alpha * 0.5})`);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1.5;
        ctx!.beginPath();
        ctx!.moveTo(tailX, tailY);
        ctx!.lineTo(cm.x, cm.y);
        ctx!.stroke();

        // Head glow
        const headGrad = ctx!.createRadialGradient(cm.x, cm.y, 0, cm.x, cm.y, cm.headR * 4);
        headGrad.addColorStop(0, `rgba(200, 220, 255, ${alpha * 0.6})`);
        headGrad.addColorStop(1, `rgba(200, 220, 255, 0)`);
        ctx!.fillStyle = headGrad;
        ctx!.beginPath();
        ctx!.arc(cm.x, cm.y, cm.headR * 4, 0, Math.PI * 2);
        ctx!.fill();

        // Head core
        ctx!.beginPath();
        ctx!.arc(cm.x, cm.y, cm.headR, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(220, 235, 255, ${alpha * 0.9})`;
        ctx!.fill();
      }

      // ── Shooting stars ──
      if (now - lastShoot > 3000 + Math.random() * 5000) spawnShooting(now);
      for (let i = shooting.length - 1; i >= 0; i--) {
        const s = shooting[i];
        s.life++;
        s.x += s.vx; s.y += s.vy;
        const p = s.life / s.maxLife;
        const alpha = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
        if (s.life > s.maxLife) { shooting.splice(i, 1); continue; }
        const tailX = s.x - s.vx * (s.len / 3);
        const tailY = s.y - s.vy * (s.len / 3);
        const grad = ctx!.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, `rgba(200, 210, 255, 0)`);
        grad.addColorStop(1, `rgba(200, 210, 255, ${alpha * 0.7})`);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(tailX, tailY);
        ctx!.lineTo(s.x, s.y);
        ctx!.stroke();
      }

      // ── Satellite ──
      if (!satellite.active && now - satellite.lastSpawn > 15000) {
        satellite.x = -0.05;
        satellite.y = 0.1 + Math.random() * 0.25;
        satellite.active = true;
        satellite.lastSpawn = now;
      }
      if (satellite.active) {
        satellite.x += satellite.speed;
        if (satellite.x > 1.05) { satellite.active = false; }
        else {
          const sx = satellite.x * w;
          const sy = satellite.y * h;
          // Glow
          const sGlow = ctx!.createRadialGradient(sx, sy, 0, sx, sy, 6);
          sGlow.addColorStop(0, "rgba(200, 220, 255, 0.3)");
          sGlow.addColorStop(1, "rgba(200, 220, 255, 0)");
          ctx!.fillStyle = sGlow;
          ctx!.beginPath();
          ctx!.arc(sx, sy, 6, 0, Math.PI * 2);
          ctx!.fill();
          // Core
          ctx!.beginPath();
          ctx!.arc(sx, sy, 1.2, 0, Math.PI * 2);
          ctx!.fillStyle = "rgba(220, 235, 255, 0.8)";
          ctx!.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); ro.disconnect(); };
  }, []);

  return <canvas ref={ref} className="pointer-events-none absolute z-0" style={{ top: 0, left: 0, width: "100%", height: "100%" }} />;
}

/* ── Planet ────────────────────────────────────────────────── */
function Planet() {
  return (
    <motion.div
      className="pointer-events-none absolute right-[-5%] top-[5%] z-0 opacity-[0.10] sm:right-[10%] sm:top-[12%] sm:opacity-[0.14]"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 0.12, scale: 1 }}
      transition={{ duration: 1.5, delay: 0.3 }}
    >
      <div className="hv-planet">
        <div className="hv-planet-body" />
        <div className="hv-planet-ring" />
        <div className="hv-planet-glow" />
      </div>
      <style>{`
        .hv-planet { position: relative; width: 120px; height: 120px; }
        @media (min-width: 640px) { .hv-planet { width: 180px; height: 180px; } }
        .hv-planet-body {
          position: absolute;
          inset: 15%;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%,
            rgba(100, 160, 255, 0.3),
            rgba(60, 100, 200, 0.2) 40%,
            rgba(30, 50, 120, 0.15) 70%,
            rgba(10, 15, 40, 0.1)
          );
          box-shadow: inset -8px -6px 20px rgba(0,0,0,0.3);
        }
        .hv-planet-ring {
          position: absolute;
          top: 42%;
          left: 5%;
          width: 90%;
          height: 16%;
          border: 1.5px solid rgba(100, 160, 255, 0.15);
          border-radius: 50%;
          transform: rotateX(70deg);
        }
        .hv-planet-glow {
          position: absolute;
          inset: -30%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.08), transparent 60%);
        }
      `}</style>
    </motion.div>
  );
}

/* ── Nebula Glow (dense) ───────────────────────────────────── */
function NebulaGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full opacity-[0.09]"
        style={{ background: "radial-gradient(circle, #6366f1, transparent 65%)", filter: "blur(80px)" }}
        animate={{ x: [0, 25, 0], y: [0, 20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-48 -right-48 h-[650px] w-[650px] rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, #ec4899, transparent 65%)", filter: "blur(90px)" }}
        animate={{ x: [0, -20, 0], y: [0, -25, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-[25%] top-[35%] h-[500px] w-[500px] rounded-full opacity-[0.05]"
        style={{ background: "radial-gradient(circle, #06b6d4, transparent 65%)", filter: "blur(80px)" }}
        animate={{ x: [0, -15, 0], y: [0, 18, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[15%] top-[5%] h-[450px] w-[450px] rounded-full opacity-[0.045]"
        style={{ background: "radial-gradient(circle, #f97316, transparent 65%)", filter: "blur(75px)" }}
        animate={{ x: [0, 12, 0], y: [0, -14, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[15%] left-[10%] h-[400px] w-[400px] rounded-full opacity-[0.04]"
        style={{ background: "radial-gradient(circle, #22c55e, transparent 65%)", filter: "blur(70px)" }}
        animate={{ x: [0, 10, 0], y: [0, -8, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ── Moon ──────────────────────────────────────────────────── */
function Moon() {
  return (
    <motion.div
      className="pointer-events-none absolute left-[-3%] top-[10%] z-0 opacity-[0.06] sm:left-[10%] sm:top-[20%] sm:opacity-[0.08]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.08 }}
      transition={{ duration: 2, delay: 0.5 }}
    >
      <div className="hv-moon">
        <div className="hv-moon-body" />
        <div className="hv-moon-crater" style={{ top: "25%", left: "30%", width: "15%", height: "15%" }} />
        <div className="hv-moon-crater" style={{ top: "55%", left: "55%", width: "10%", height: "10%" }} />
        <div className="hv-moon-crater" style={{ top: "40%", left: "65%", width: "8%", height: "8%" }} />
        <div className="hv-moon-glow" />
      </div>
      <style>{`
        .hv-moon { position: relative; width: 60px; height: 60px; }
        @media (min-width: 640px) { .hv-moon { width: 80px; height: 80px; } }
        .hv-moon-body {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle at 40% 35%,
            rgba(200, 210, 230, 0.5),
            rgba(150, 160, 180, 0.3) 50%,
            rgba(100, 110, 130, 0.2) 80%,
            rgba(60, 70, 90, 0.1)
          );
          box-shadow: inset -4px -3px 10px rgba(0,0,0,0.3);
        }
        .hv-moon-crater {
          position: absolute;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.08);
        }
        .hv-moon-glow {
          position: absolute;
          inset: -40%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(200, 210, 230, 0.06), transparent 60%);
        }
      `}</style>
    </motion.div>
  );
}

/* ── Aurora Waves (enhanced) ────────────────────────────────── */
function AuroraWaves() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-64 overflow-hidden sm:h-80">
      <motion.div
        className="absolute inset-x-0 top-0 h-full"
        style={{
          background: "linear-gradient(180deg, rgba(6,182,212,0.25), rgba(99,102,241,0.18) 30%, rgba(139,92,246,0.12) 55%, transparent)",
          filter: "blur(45px)",
        }}
        animate={{ y: [0, -12, 0], opacity: [0.07, 0.11, 0.07] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-x-0 top-6 h-full"
        style={{
          background: "linear-gradient(180deg, rgba(236,72,153,0.18), rgba(59,130,246,0.12) 35%, rgba(34,197,94,0.06) 65%, transparent)",
          filter: "blur(55px)",
        }}
        animate={{ y: [0, -10, 0], opacity: [0.05, 0.08, 0.05] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute inset-x-[-10%] top-12 h-full"
        style={{
          background: "linear-gradient(180deg, rgba(249,115,22,0.1), rgba(234,179,8,0.08) 30%, transparent)",
          filter: "blur(60px)",
        }}
        animate={{ y: [0, -8, 0], opacity: [0.04, 0.06, 0.04] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />
    </div>
  );
}

/* ── HUD Brackets ──────────────────────────────────────────── */
function HudBrackets() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      {/* Top-left */}
      <div className="absolute left-4 top-4 h-5 w-5 border-l border-t border-accent/10 sm:left-8 sm:top-8 sm:h-6 sm:w-6" />
      {/* Top-right */}
      <div className="absolute right-4 top-4 h-5 w-5 border-r border-t border-accent/10 sm:right-8 sm:top-8 sm:h-6 sm:w-6" />
      {/* Bottom-left */}
      <div className="absolute bottom-4 left-4 h-5 w-5 border-b border-l border-accent/10 sm:bottom-8 sm:left-8 sm:h-6 sm:w-6" />
      {/* Bottom-right */}
      <div className="absolute bottom-4 right-4 h-5 w-5 border-b border-r border-accent/10 sm:bottom-8 sm:right-8 sm:h-6 sm:w-6" />
      {/* Side tick marks */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 sm:left-8">
        <div className="mb-1 h-px w-3 bg-accent/8" />
        <div className="mb-1 h-px w-2 bg-accent/5" />
        <div className="h-px w-3 bg-accent/8" />
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 sm:right-8">
        <div className="mb-1 h-px w-3 bg-accent/8" />
        <div className="mb-1 h-px w-2 bg-accent/5" />
        <div className="h-px w-3 bg-accent/8" />
      </div>
    </div>
  );
}

/* ── Grid Warp (perspective depth) ─────────────────────────── */
function GridWarp() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-52 overflow-hidden opacity-[0.04] sm:h-64">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          transform: "perspective(400px) rotateX(60deg)",
          transformOrigin: "center bottom",
          maskImage: "linear-gradient(to top, black 0%, transparent 80%)",
          WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 80%)",
        }}
      />
    </div>
  );
}

/* ── Scanlines ─────────────────────────────────────────────── */
function Scanlines() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 opacity-[0.015]"
      style={{
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
      }}
    />
  );
}

/* ── Full Grid ─────────────────────────────────────────────── */
function FullGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.015]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(100,160,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(100,160,255,0.3) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
    </div>
  );
}

/* ── Title — gradient dark / split-color light ─────────────── */
function Title() {
  return (
    <div className="hv-hero-title-wrap">
      <span className="hv-title-hud-tr" />
      <span className="hv-title-hud-bl" />
      <div className="hv-title-data" style={{ top: "-0.2em", left: "0.4em" }}>
        SYS_ID:0x7F <span className="hv-title-data-dim">// HYPERSPACE LINK</span>
      </div>
      <div className="hv-title-data" style={{ top: "-0.2em", right: "0.4em", left: "auto", textAlign: "right" }}>
        <span className="hv-title-data-dim">FREQ </span>3.7GHz <span className="hv-title-data-dim">SIG </span>■■■■□
      </div>
      <div className="hv-title-data" style={{ bottom: "-0.2em", left: "0.4em" }}>
        <span className="hv-title-data-dim">SECTOR </span>7G<span className="hv-title-data-dim"> //</span> DEEP SPACE
      </div>
      <div className="hv-title-data" style={{ bottom: "-0.2em", right: "0.4em", left: "auto", textAlign: "right" }}>
        <span className="hv-title-data-dim">STATUS </span>NOMINAL <span className="hv-title-data-blink">●</span>
      </div>

      <span className="hv-hero-title" data-text="HYPERV∅ID">
        <span className="hv-t-hyper">HYPER</span>
        <span className="hv-t-void">V∅ID</span>
      </span>

      <style>{`
        .hv-hero-title-wrap {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2.2em 2em 2em;
          max-width: 100%;
        }
        .hv-hero-title {
          position: relative;
          z-index: 1;
          display: inline-block;
          font-family: var(--font-orbitron), "Orbitron", ui-sans-serif, system-ui, sans-serif;
          font-size: clamp(2.2rem, 10vw, 6rem);
          font-weight: 900;
          line-height: 0.88;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
        @media (max-width: 420px) {
          .hv-hero-title {
            font-size: 2rem;
          }
          .hv-hero-title-wrap {
            padding: 1.5em 0.8em 1.4em;
          }
          .hv-title-data {
            display: none !important;
          }
        }
        /* ── Stagger: inline with offset ── */
        .hv-t-hyper {
          display: inline-block;
          transform: translateY(0.015em);
          letter-spacing: 0.04em;
        }
        .hv-t-void {
          display: inline-block;
          transform: translateX(0.03em) translateY(-0.015em);
        }
        /* ── HYPER gradient — dark mode ── */
        .hv-t-hyper {
          background: linear-gradient(135deg, #ef4444, #f97316, #eab308, #22c55e, #14b8a6, #06b6d4, #3b82f6, #6366f1, #8b5cf6, #a855f7, #d946ef, #ec4899, #f43f5e, #ef4444);
          background-size: 800% 800%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: ht-grad 14s linear infinite;
          filter: drop-shadow(0 0 20px rgba(56,189,248,0.2));
        }
        /* ── HYPER gradient — light mode: bolder, higher contrast ── */
        .light .hv-t-hyper {
          background: linear-gradient(135deg, #dc2626, #ea580c, #d97706, #16a34a, #0d9488, #0284c7, #4f46e5, #7c3aed, #a855f7, #db2777, #e11d48, #dc2626);
          background-size: 800% 800%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: ht-grad 14s linear infinite;
          filter: drop-shadow(0 0 12px rgba(180,83,9,0.2));
        }
        /* ── VOID — dark mode: white with flicker ── */
        .hv-t-void {
          color: #ffffff;
          text-shadow: 0 0 12px rgba(255,255,255,0.25), 0 0 35px rgba(255,255,255,0.08);
          animation: ht-void-flicker 4s steps(1) infinite;
        }
        /* ── VOID — light mode: dark, no glow ── */
        .light .hv-t-void {
          color: #1a1a2e;
          text-shadow: none;
          animation: none;
        }
        /* Chromatic aberration */
        .hv-hero-title::after {
          content: "HYPERV∅ID";
          position: absolute;
          inset: 0;
          color: #22d3ee;
          text-shadow: 3px 0 rgba(250,204,21,0.4), -3px 0 rgba(244,114,182,0.4);
          animation: ht-cp-glitch 4s steps(2, end) infinite;
          opacity: 0;
        }
        /* HUD brackets */
        .hv-hero-title-wrap::before, .hv-hero-title-wrap::after {
          content: "";
          position: absolute;
          width: 24px; height: 24px;
          border-style: solid;
          animation: ht-corner-pulse 2.5s ease-in-out infinite;
        }
        .dark .hv-hero-title-wrap::before, .dark .hv-hero-title-wrap::after {
          border-color: rgba(250,204,21,0.25);
        }
        .hv-hero-title-wrap::before { top: -6px; left: -6px; border-width: 2px 0 0 2px; }
        .hv-hero-title-wrap::after { bottom: -6px; right: -6px; border-width: 0 2px 2px 0; }
        .hv-title-hud-tr, .hv-title-hud-bl {
          position: absolute;
          width: 24px; height: 24px;
          border-style: solid;
          pointer-events: none;
          animation: ht-corner-pulse 2.5s ease-in-out infinite 1.2s;
        }
        .dark .hv-title-hud-tr, .dark .hv-title-hud-bl {
          border-color: rgba(56,189,248,0.2);
        }
        .hv-title-hud-tr { top: -6px; right: -6px; border-width: 2px 2px 0 0; }
        .hv-title-hud-bl { bottom: -6px; left: -6px; border-width: 0 0 2px 2px; }
        .hv-title-data {
          position: absolute;
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 0.55rem;
          letter-spacing: 0.08em;
          white-space: nowrap;
          pointer-events: none;
          z-index: 3;
        }
        .hv-title-data { color: rgba(250,204,21,0.28); }
        .hv-title-data-dim { opacity: 0.45; }
        .hv-title-data-blink {
          animation: ht-blink 1s step-end infinite;
        }
        .hv-title-data-blink { color: rgba(56,189,248,0.5); }
        /* ── Keyframes ── */
        @keyframes ht-grad {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes ht-void-flicker {
          0%, 100% { opacity: 1; }
          4% { opacity: 0.15; }
          6% { opacity: 1; }
          8% { opacity: 0.4; }
          10% { opacity: 1; }
          50% { opacity: 1; }
          52% { opacity: 0.2; }
          54% { opacity: 1; }
          80% { opacity: 1; }
          82% { opacity: 0.3; }
          83% { opacity: 0.9; }
          84% { opacity: 0.15; }
          86% { opacity: 1; }
        }
        @keyframes ht-cp-glitch {
          0%, 82%, 100% { clip-path: inset(0); transform: none; opacity: 0; }
          84% { clip-path: inset(20% 0 60% 0); transform: translate(-5px, 0) skewX(-2deg); opacity: 0.7; }
          86% { clip-path: inset(0); transform: none; opacity: 0; }
          88% { clip-path: inset(55% 0 15% 0); transform: translate(5px, 0) skewX(2deg); opacity: 0.7; }
          90% { clip-path: inset(0); transform: none; opacity: 0; }
          92% { clip-path: inset(35% 0 40% 0); transform: translate(-3px, 1px); opacity: 0.5; }
          94% { clip-path: inset(0); transform: none; opacity: 0; }
        }
        @keyframes ht-corner-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes ht-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hv-t-hyper { animation: none; background-position: 0% 50%; }
          .hv-t-void { animation: none; opacity: 1; }
          .hv-hero-title::after { display: none; }
          .hv-title-data-blink { animation: none; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ── Ticker ────────────────────────────────────────────────── */
function Ticker() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => new Date(0));
  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const date = now.toLocaleDateString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit" });
  const day = now.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();

  const SEP = " ◆ ";
  const cell = mounted
    ? `UTC ${time}  ${SEP}  ${date}  ${SEP}  ${day}  ${SEP}  SECTOR 7G  ${SEP}  DEEP SPACE  ${SEP}  WARP READY  ${SEP}  NEBULA SCAN  ${SEP}`
    : `SECTOR 7G  ${SEP}  DEEP SPACE  ${SEP}  WARP READY  ${SEP}  NEBULA SCAN  ${SEP}  STARFIELD ACTIVE  ${SEP}`;
  const strip = cell + cell + cell;

  return (
    <div className="hv-ticker-outer">
      <div className="hv-ticker-track">
        <span className="hv-ticker-text">{strip}</span>
      </div>
      <style>{`
        .hv-ticker-outer {
          overflow: hidden;
          border-bottom: 1px solid color-mix(in srgb, var(--accent) 6%, transparent);
          background: color-mix(in srgb, var(--card) 20%, transparent);
        }
        .hv-ticker-track {
          display: flex;
          width: max-content;
          animation: ticker-scroll 40s linear infinite;
        }
        .hv-ticker-text {
          flex-shrink: 0;
          padding: 0.4rem 0;
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          color: var(--muted);
          opacity: 0.7;
          white-space: nowrap;
        }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hv-ticker-track { animation: none; }
        }
      `}</style>
    </div>
  );
}

/* ── Featured Clock ────────────────────────────────────────── */
function FeaturedClock() {
  const [time, setTime] = useState({ h: "00", m: "00", s: "00", ms: "000", date: "", day: "" });
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime({
        h: d.toLocaleTimeString("en-GB", { hour: "2-digit", hour12: false }),
        m: d.toLocaleTimeString("en-GB", { minute: "2-digit" }),
        s: d.toLocaleTimeString("en-GB", { second: "2-digit" }),
        ms: String(d.getMilliseconds()).padStart(3, "0"),
        date: d.toLocaleDateString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit" }),
        day: d.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase(),
      });
    };
    tick();
    const iv = setInterval(tick, 50);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="hv-clock-frame">
      {/* Corner marks */}
      <span className="hv-clock-corner hv-clock-tl" />
      <span className="hv-clock-corner hv-clock-tr" />
      <span className="hv-clock-corner hv-clock-bl" />
      <span className="hv-clock-corner hv-clock-br" />
      {/* Side labels */}
      <span className="hv-clock-label hv-clock-label-l">CHRONO</span>
      <span className="hv-clock-label hv-clock-label-r">UTC+0</span>

      <div className="flex flex-col items-center gap-1">
        <div className="flex items-baseline font-mono tabular-nums">
          <span className="hv-clock-digit">{time.h}</span>
          <span className="hv-clock-sep">:</span>
          <span className="hv-clock-digit">{time.m}</span>
          <span className="hv-clock-sep">:</span>
          <span className="hv-clock-s">{time.s}</span>
          <span className="hv-clock-ms">.{time.ms}</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-white/20 sm:text-[12px]">
          <span>{time.date}</span>
          <span className="text-white/10">//</span>
          <span>{time.day}</span>
        </div>
      </div>

      <style>{`
        .hv-clock-frame {
          position: relative;
          display: inline-block;
          padding: 0.75rem 2rem;
        }
        /* Corner marks */
        .hv-clock-corner {
          position: absolute;
          width: 10px; height: 10px;
          border-color: rgba(59,130,246,0.3);
          border-style: solid;
        }
        .hv-clock-tl { top: 0; left: 0; border-width: 1px 0 0 1px; }
        .hv-clock-tr { top: 0; right: 0; border-width: 1px 1px 0 0; }
        .hv-clock-bl { bottom: 0; left: 0; border-width: 0 0 1px 1px; }
        .hv-clock-br { bottom: 0; right: 0; border-width: 0 1px 1px 0; }
        /* Side labels */
        .hv-clock-label {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 0.5rem;
          letter-spacing: 0.15em;
          color: rgba(59,130,246,0.2);
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
        .hv-clock-label-l { left: -0.2rem; }
        .hv-clock-label-r { right: -0.2rem; }
        /* Digits */
        .hv-clock-digit {
          font-size: 2.2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: rgba(255,255,255,0.5);
          text-shadow: 0 0 20px rgba(59,130,246,0.15);
          transition: color 0.1s;
        }
        .hv-clock-sep {
          font-size: 2.2rem;
          font-weight: 200;
          color: rgba(59,130,246,0.35);
          animation: clock-sep-pulse 1s ease-in-out infinite;
          margin: 0 0.05em;
        }
        .hv-clock-s {
          font-size: 1.5rem;
          font-weight: 500;
          color: rgba(255,255,255,0.3);
        }
        .hv-clock-ms {
          font-size: 0.8rem;
          font-weight: 400;
          color: rgba(59,130,246,0.25);
          margin-left: 0.1em;
        }
        @media (min-width: 640px) {
          .hv-clock-digit { font-size: 3.5rem; }
          .hv-clock-sep { font-size: 3.5rem; }
          .hv-clock-s { font-size: 2.2rem; }
          .hv-clock-ms { font-size: 1rem; }
        }
        @keyframes clock-sep-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hv-clock-sep { animation: none; opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

/* ── Typewriter Quote ──────────────────────────────────────── */
function TypewriterQuote({ text, author }: { text: string; author: string }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!text) return;
    setDisplayed("");
    setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(iv); setDone(true); }
    }, 40);
    return () => clearInterval(iv);
  }, [text]);
  if (!text) return null;
  return (
    <blockquote className="text-center">
      <p className="text-[14px] leading-relaxed text-muted-soft/55 sm:text-[15px]">
        「{displayed}{!done && <span className="inline-block h-3.5 w-px animate-pulse bg-accent/50 align-middle" />}」
      </p>
      {author ? <cite className="mt-1 block font-mono text-[11px] text-muted-soft/40 not-italic transition-opacity duration-500" style={{ opacity: done ? 1 : 0 }}>—— {author}</cite> : null}
    </blockquote>
  );
}

/* ── Status Strip ──────────────────────────────────────────── */
function StatusStrip() {
  const [statusIdx, setStatusIdx] = useState(0);
  const [uptimeDays, setUptimeDays] = useState(0);
  const statuses = [
    "ALL SYSTEMS NOMINAL",
    "STARFIELD ACTIVE",
    "WARP CORE STABLE",
    "DEEP SPACE SCANNING",
    "SIGNAL PRISTINE",
    "ORBIT LOCKED",
  ];
  useEffect(() => {
    setUptimeDays(Math.floor((Date.now() - new Date("2026-05-23").getTime()) / 86_400_000));
    const iv = setInterval(() => setStatusIdx((i) => (i + 1) % statuses.length), 3000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-soft/45 sm:gap-x-6">
      <span>UPTIME {uptimeDays}D</span>
      <span className="hidden sm:inline text-muted-soft/25">·</span>
      <motion.span key={statusIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        ▸ {statuses[statusIdx]}
      </motion.span>
    </div>
  );
}

/* ── Hero ──────────────────────────────────────────────────── */
export function HeroSection({
  quote, quoteAuthor, stats,
}: {
  quote: string; quoteAuthor: string;
  stats: { articles: number; words: number; minutes: number; tags: number };
  recentPosts: { slug: string; title: string }[];
  topTags?: { tag: string; count: number }[];
}) {
  const t = useT();

  const fmt = (n: number) => {
    if (n >= 10000) return (n / 10000).toFixed(1) + "w";
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return n.toLocaleString();
  };

  return (
    <section className="hv-cosmic-hero relative overflow-hidden" style={{ background: "transparent" }}>
      {/* Desktop-only effects */}
      <div className="hidden sm:block">
        <FullGrid />
        <Starfield />
        <NebulaGlow />
        <AuroraWaves />
        <Planet />
        <Moon />
        <GridWarp />
        <Scanlines />
      </div>
      <HudBrackets />
      {/* Light mode overlay */}
      <div className="hv-light-overlay pointer-events-none absolute inset-0 z-[5]" />

      {/* Ticker — hidden on mobile */}
      <div className="hidden sm:block">
        <Ticker />
      </div>

      <div className="relative z-10 mx-auto max-w-[100rem]">
        <div className="flex flex-col items-center px-5 pt-6 pb-3 sm:px-6 sm:pt-8 sm:pb-4 lg:px-8 lg:pt-10 lg:pb-5">

          {/* Status badge */}
          <R d={0.05}>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/20 bg-card/10 px-3 py-1 backdrop-blur-sm sm:mb-4">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-soft/60">{t.hero.systemOnline}</span>
            </div>
          </R>

          {/* Title */}
          <R d={0.1}>
            <Title />
          </R>

          {/* Subtitle */}
          <R d={0.15}>
            <p className="mt-1.5 font-mono text-[13px] uppercase tracking-[0.3em] text-muted-soft/50 sm:mt-2">
              {t.hero.subtitle}
            </p>
          </R>

          {/* Featured Clock — desktop only */}
          <div className="hidden sm:block">
            <R d={0.2} className="mt-4 sm:mt-5">
              <FeaturedClock />
            </R>
          </div>

          {/* Divider */}
          <R d={0.25} className="mt-3 sm:mt-4">
            <div className="flex items-center gap-3">
              <div className="h-px w-10 bg-gradient-to-r from-transparent to-accent/15" />
              <div className="h-1 w-1 rotate-45 bg-accent/25" />
              <div className="h-px w-10 bg-gradient-to-l from-transparent to-accent/15" />
            </div>
          </R>

          {/* Status strip — desktop only */}
          <div className="hidden sm:block">
            <R d={0.3} className="mt-3 sm:mt-4">
              <StatusStrip />
            </R>
          </div>

          {/* Quote */}
          {quote ? (
            <R d={0.35} className="mt-3 max-w-lg sm:mt-4">
              <TypewriterQuote text={quote} author={quoteAuthor} />
            </R>
          ) : null}

          {/* Stats */}
          <R d={0.4} className="mt-3 sm:mt-4">
            <div className="flex items-center gap-4 font-mono text-[13px] text-muted-soft/55 sm:gap-5">
              <span><span className="font-bold text-foreground/65">{fmt(stats.articles)}</span> {t.hero.stats.articles}</span>
              <span className="h-3 w-px bg-border/20" />
              <span><span className="font-bold text-foreground/65">{fmt(stats.words)}</span> {t.hero.stats.words}</span>
              <span className="h-3 w-px bg-border/20" />
              <span><span className="font-bold text-foreground/65">{fmt(stats.tags)}</span> {t.hero.stats.tags}</span>
            </div>
          </R>

          {/* CTAs */}
          <R d={0.45} className="mt-4 sm:mt-5">
            <div className="flex items-center gap-2.5">
              <Mag>
                <Link href="/posts"
                  className="group inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/8 px-5 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-accent transition-all hover:border-accent/50 hover:bg-accent/15 hover:shadow-[0_0_20px_var(--accent-glow)]"
                >
                  {t.hero.enterPosts}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Mag>
              <Mag>
                <Link href="/about"
                  className="inline-flex items-center rounded-full border border-border/20 bg-card/10 px-4 py-2 font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-muted/70 transition hover:border-accent/20 hover:text-foreground"
                >
                  {t.hero.aboutMe}
                </Link>
              </Mag>
            </div>
          </R>
        </div>
      </div>
    </section>
  );
}
