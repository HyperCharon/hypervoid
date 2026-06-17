"use client";

import { useEffect, useRef, useState } from "react";
import { fetchEffects } from "@/lib/effects-cache";

interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  hue: number;
  life: number;
  maxLife: number;
}

export function SparkleEffect() {
  const [enabled, setEnabled] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparkles = useRef<Sparkle[]>([]);
  const animFrame = useRef<number>(0);

  useEffect(() => {
    fetchEffects()
      .then((d) => setEnabled(Boolean(d.textSparkle)))
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

    const spawnAt = (x: number, y: number) => {
      const count = 8 + Math.floor(Math.random() * 10);
      const baseHue = (Date.now() / 30) % 360;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3;
        const life = 30 + Math.random() * 50;
        sparkles.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          size: 2 + Math.random() * 4,
          opacity: 1,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.15,
          hue: baseHue + (Math.random() - 0.5) * 60,
          life,
          maxLife: life,
        });
      }
    };

    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      spawnAt(cx, cy);

      if (rect.width > 50) {
        spawnAt(rect.left + 5, cy);
        spawnAt(rect.right - 5, cy);
      }
    };

    const onMouseUp = () => setTimeout(handleSelection, 0);

    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchend", onMouseUp);

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparkles.current = sparkles.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.rotation += p.rotationSpeed;
        p.life--;
        p.opacity = Math.max(0, (p.life / p.maxLife) * 0.9);
        p.size *= 0.985;
        return p.life > 0;
      });

      for (const p of sparkles.current) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = `hsl(${p.hue} 80% 65%)`;

        const s = p.size;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          const a2 = a + Math.PI / 4;
          ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
          ctx.lineTo(Math.cos(a2) * s * 0.3, Math.sin(a2) * s * 0.3);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      animFrame.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchend", onMouseUp);
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
