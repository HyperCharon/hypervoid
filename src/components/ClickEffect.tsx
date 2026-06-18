"use client";

import { useEffect, useRef, useState } from "react";
import { fetchEffects } from "@/lib/effects-cache";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  hue: number;
}

export function ClickEffect() {
  const [enabled, setEnabled] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animFrame = useRef<number>(0);

  useEffect(() => {
    fetchEffects()
      .then((d) => setEnabled(Boolean(d.clickParticles)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const spawn = (x: number, y: number, baseHue: number) => {
      const count = 8 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = 2 + Math.random() * 4;
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 3,
          alpha: 1,
          decay: 0.015 + Math.random() * 0.015,
          hue: baseHue + (Math.random() - 0.5) * 40,
        });
      }
    };

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter((p) => p.alpha > 0);
      if (particles.current.length === 0) {
        animFrame.current = 0;
        return;
      }
      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.alpha -= p.decay;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = `hsl(${p.hue} 70% 60%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      animFrame.current = requestAnimationFrame(loop);
    };
    loop();

    const onClick = (e: MouseEvent) => {
      const baseHue = (Date.now() / 30) % 360;
      spawn(e.clientX, e.clientY, baseHue);
      if (!animFrame.current) {
        animFrame.current = requestAnimationFrame(loop);
      }
    };
    window.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("click", onClick);
      cancelAnimationFrame(animFrame.current);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9997] pointer-events-none"
    />
  );
}
