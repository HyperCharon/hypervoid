"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, Languages } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLocale } from "@/components/LocaleProvider";
import { siteConfig } from "@/lib/site-config";
import type { CvData } from "@/lib/cv-data";
import { Hero, Dashboard, Contact } from "./sections";
import "./cv.css";

const EASE = "power4.out";
const EASE_SOFT = "power3.out";

/* ── Hero particle network ──────────────────────────────────────── */
function initParticles(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  let w = 0;
  let h = 0;
  let mx = -9999;
  let my = -9999;
  let raf = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  type P = { x: number; y: number; vx: number; vy: number; r: number };
  let particles: P[] = [];

  function resize() {
    const parent = canvas.parentElement!;
    w = parent.clientWidth;
    h = parent.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx!.scale(dpr, dpr);
  }

  function seed() {
    const count = Math.min(Math.round((w * h) / 12000), 80);
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
    }));
  }

  function draw() {
    ctx!.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      const dx = p.x - mx;
      const dy = p.y - my;
      const dist = Math.hypot(dx, dy);
      if (dist < 120) {
        const f = ((120 - dist) / 120) * 0.6;
        p.vx += (dx / dist) * f;
        p.vy += (dy / dist) * f;
      }
      p.vx *= 0.99;
      p.vy *= 0.99;
    }
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 140) {
          ctx!.strokeStyle = `rgba(110,168,255,${(1 - d / 140) * 0.15})`;
          ctx!.lineWidth = 0.5;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
      }
    }
    for (const p of particles) {
      const dm = Math.hypot(p.x - mx, p.y - my);
      const glow = dm < 160 ? (1 - dm / 160) * 0.8 : 0;
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.r + glow * 2, 0, Math.PI * 2);
      ctx!.fillStyle = glow > 0.1 ? `rgba(110,168,255,${0.3 + glow * 0.5})` : "rgba(110,168,255,0.2)";
      ctx!.fill();
      if (glow > 0.2) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r + glow * 6, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(110,168,255,${glow * 0.12})`;
        ctx!.fill();
      }
    }
    raf = requestAnimationFrame(draw);
  }

  function onMove(e: MouseEvent) {
    const r = canvas.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
  }
  function onLeave() {
    mx = -9999;
    my = -9999;
  }

  resize();
  seed();
  draw();
  window.addEventListener("resize", () => { resize(); seed(); });
  canvas.addEventListener("mousemove", onMove, { passive: true });
  canvas.addEventListener("mouseleave", onLeave);

  return () => {
    cancelAnimationFrame(raf);
    canvas.removeEventListener("mousemove", onMove);
    canvas.removeEventListener("mouseleave", onLeave);
  };
}

export function CvPage({ data }: { data: CvData }) {
  const { locale, setLocale } = useLocale();
  const rootRef = useRef<HTMLDivElement | null>(null);

  // ── Particle canvas ─────────────────────────────────────────────
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = root.querySelector<HTMLCanvasElement>(".cv-hero-particles");
    if (!canvas) return;
    return initParticles(canvas);
  }, []);

  // ── Main animation suite ────────────────────────────────────────
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 768px)").matches;

    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: EASE, duration: 1 });

    let ctx: gsap.Context | undefined;
    let onMouseMove: ((e: MouseEvent) => void) | undefined;

    try {
      ctx = gsap.context(() => {
        /* ── Hero sequence ────────────────────────────────────────── */
        const heroTl = gsap.timeline({ delay: 0.05 });

        heroTl.fromTo(
          ".cv-avatar-reveal",
          { clipPath: "circle(0% at 50% 50%)" },
          { clipPath: "circle(75% at 50% 50%)", duration: 1.2, ease: "power3.inOut" },
          0,
        );

        const chars = root.querySelectorAll<HTMLElement>(".cv-hero .cv-char");
        if (chars.length) {
          heroTl.fromTo(
            chars,
            { opacity: 0, y: 40, rotateX: -60 },
            { opacity: 1, y: 0, rotateX: 0, duration: 0.7, stagger: 0.03, ease: "back.out(1.4)", clearProps: "transform" },
            0.3,
          );
        }

        heroTl.fromTo(
          ".cv-hero .cv-rise",
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.85, stagger: 0.07, clearProps: "transform" },
          0.65,
        );

        // Stats counter
        root.querySelectorAll<HTMLElement>(".cv-hero .cv-stat-value[data-count]").forEach((el) => {
          const raw = el.dataset.count ?? "";
          const num = parseFloat(raw.replace(/[^0-9.]/g, ""));
          if (!raw.includes("∞") && !isNaN(num)) {
            const suffix = raw.replace(/[0-9.]/g, "");
            const obj = { v: 0 };
            heroTl.to(obj, {
              v: num, duration: 1.6, ease: "power2.out",
              onUpdate() { el.textContent = Math.round(obj.v) + suffix; },
            }, 0.8);
          }
        });

        /* ── Progress bar ─────────────────────────────────────────── */
        gsap.to(".cv-progress-bar", {
          scaleX: 1, ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.3 },
        });

        /* ── Hero fade on scroll ──────────────────────────────────── */
        gsap.to(".cv-hero-inner", {
          opacity: 0, y: -60, ease: "none",
          scrollTrigger: { trigger: ".cv-hero", start: "30% top", end: "bottom top", scrub: true },
        });

        /* ── Dashboard: pinned scrub (desktop only) ───────────────── */
        if (!mobile && !reduced) {
          const dashEl = root.querySelector<HTMLElement>(".cv-dash");
          if (dashEl) {
            const panels = dashEl.querySelectorAll<HTMLElement>(".cv-dash-panel");

            gsap.fromTo(panels,
              { opacity: 0, y: 30, scale: 0.97 },
              {
                opacity: 1, y: 0, scale: 1,
                duration: 0.6, stagger: 0.08, ease: EASE_SOFT, clearProps: "transform",
                scrollTrigger: {
                  trigger: dashEl,
                  start: "top 80%",
                  once: true,
                },
              },
            );

            // Dashboard stats counter
            dashEl.querySelectorAll<HTMLElement>(".cv-dash-stat-val[data-count]").forEach((el) => {
              const raw = el.dataset.count ?? "";
              const num = parseFloat(raw.replace(/[^0-9.]/g, ""));
              if (!raw.includes("∞") && !isNaN(num)) {
                const suffix = raw.replace(/[0-9.]/g, "");
                const obj = { v: 0 };
                gsap.to(obj, {
                  v: num, duration: 1.4, ease: "power2.out", delay: 0.3,
                  onUpdate() { el.textContent = Math.round(obj.v) + suffix; },
                  scrollTrigger: { trigger: dashEl, start: "top 80%", once: true },
                });
              }
            });

            // Skill chips stagger
            const chips = dashEl.querySelectorAll<HTMLElement>(".cv-dash-chip");
            gsap.fromTo(chips,
              { opacity: 0, y: 10, scale: 0.9 },
              {
                opacity: 1, y: 0, scale: 1,
                duration: 0.4, stagger: 0.025, ease: EASE_SOFT, clearProps: "transform", delay: 0.4,
                scrollTrigger: { trigger: dashEl, start: "top 80%", once: true },
              },
            );

            // Timeline items stagger
            const tlItems = dashEl.querySelectorAll<HTMLElement>(".cv-dash-tl-item");
            gsap.fromTo(tlItems,
              { opacity: 0, x: -16 },
              {
                opacity: 1, x: 0,
                duration: 0.5, stagger: 0.1, ease: EASE_SOFT, clearProps: "transform", delay: 0.3,
                scrollTrigger: { trigger: dashEl, start: "top 80%", once: true },
              },
            );

            // Project cards stagger
            const projCards = dashEl.querySelectorAll<HTMLElement>(".cv-dash-proj");
            gsap.fromTo(projCards,
              { opacity: 0, y: 16, scale: 0.95 },
              {
                opacity: 1, y: 0, scale: 1,
                duration: 0.5, stagger: 0.08, ease: EASE_SOFT, clearProps: "transform", delay: 0.5,
                scrollTrigger: { trigger: dashEl, start: "top 80%", once: true },
              },
            );
          }
        } else {
          // Mobile: simple stagger reveal (no pin)
          root.querySelectorAll<HTMLElement>(".cv-dash-panel").forEach((panel) => {
            gsap.fromTo(panel,
              { opacity: 0, y: 24 },
              {
                opacity: 1, y: 0, duration: 0.7, clearProps: "transform",
                scrollTrigger: { trigger: panel, start: "top 90%", once: true },
              },
            );
          });
        }

        /* ── Contact: cinematic reveal ────────────────────────────── */
        gsap.fromTo(".cv-contact-head",
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 1, clearProps: "transform",
            scrollTrigger: { trigger: ".cv-contact", start: "top 75%", once: true },
          },
        );

        const contactChips = root.querySelectorAll<HTMLElement>(".cv-contact-chip");
        gsap.fromTo(contactChips,
          { opacity: 0, y: 16, rotate: -2 },
          {
            opacity: 1, y: 0, rotate: 0, duration: 0.55, stagger: 0.06, clearProps: "transform",
            scrollTrigger: { trigger: ".cv-contact-list", start: "top 85%", once: true },
          },
        );

        gsap.fromTo(".cv-foot",
          { opacity: 0, y: 12 },
          {
            opacity: 1, y: 0, duration: 0.6, clearProps: "transform",
            scrollTrigger: { trigger: ".cv-foot", start: "top 94%", once: true },
          },
        );

        /* ── Card hover: perspective tilt ─────────────────────────── */
        if (!reduced && window.matchMedia("(pointer: fine)").matches) {
          onMouseMove = (e: MouseEvent) => {
            root.querySelectorAll<HTMLElement>(".cv-dash-proj-link").forEach((card) => {
              const r = card.getBoundingClientRect();
              const cx = r.left + r.width / 2;
              const cy = r.top + r.height / 2;
              const dx = (e.clientX - cx) / (r.width / 2);
              const dy = (e.clientY - cy) / (r.height / 2);
              const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
              if (dist < 300) {
                const t = 1 - dist / 300;
                gsap.to(card, { rotateY: dx * 4 * t, rotateX: -dy * 4 * t, duration: 0.4, overwrite: "auto" });
              } else {
                gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.5, overwrite: "auto" });
              }
            });
          };
          window.addEventListener("mousemove", onMouseMove, { passive: true });
        }

        /* ── Glow parallax ────────────────────────────────────────── */
        if (!reduced && window.matchMedia("(pointer: fine)").matches) {
          gsap.to(".cv-hero-glow", {
            yPercent: 28, ease: "none",
            scrollTrigger: { trigger: ".cv-hero", start: "top top", end: "bottom top", scrub: true },
          });
        }

        requestAnimationFrame(() => ScrollTrigger.refresh());
      }, root);

      // Safety net
      const safety = window.setTimeout(() => {
        root.querySelectorAll<HTMLElement>(".cv-hero .cv-char, .cv-avatar-reveal, .cv-rise, .cv-dash-panel, .cv-contact-head, .cv-contact-chip").forEach((el) => {
          if (getComputedStyle(el).opacity === "0") {
            el.style.opacity = "1";
            el.style.transform = "none";
            el.style.clipPath = "none";
          }
        });
      }, 2000);

      return () => {
        window.clearTimeout(safety);
        if (onMouseMove) window.removeEventListener("mousemove", onMouseMove);
        ctx?.revert();
      };
    } catch {
      root.querySelectorAll<HTMLElement>(".cv-hero .cv-char, .cv-avatar-reveal, .cv-rise, .cv-dash-panel").forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
        el.style.clipPath = "none";
      });
    }
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [locale]);

  const toggleLocale = () => setLocale(locale === "en" ? "zh-CN" : "en");
  const en = locale === "en";

  return (
    <div ref={rootRef} className="cv-root dark-locked">
      <noscript>
        <style>{`.cv-char,.cv-avatar-reveal,.cv-rise,.cv-dash-panel,.cv-contact-head,.cv-contact-chip{opacity:1!important;transform:none!important;clip-path:none!important}`}</style>
      </noscript>

      <div className="cv-progress" aria-hidden>
        <div className="cv-progress-bar" />
      </div>

      <div className="cv-topbar">
        <a href={siteConfig.url} className="cv-tb-btn cv-back" aria-label={en ? "Back to site" : "返回站点"}>
          <ArrowLeft className="cv-tb-icon" aria-hidden />
          <span>{en ? "Back" : "返回"}</span>
        </a>
        <button type="button" className="cv-tb-btn cv-lang" onClick={toggleLocale} aria-label={en ? "Switch to Chinese" : "切换为英文"}>
          <Languages className="cv-tb-icon" aria-hidden />
          <span>{en ? "中文" : "EN"}</span>
        </button>
      </div>

      <main className="cv-main">
        <Hero locale={locale} data={data} />
        <Dashboard locale={locale} data={data} />
        <Contact locale={locale} data={data} />
      </main>
    </div>
  );
}
