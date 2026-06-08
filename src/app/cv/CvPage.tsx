"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, Languages } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLocale } from "@/components/LocaleProvider";
import { siteConfig } from "@/lib/site-config";
import type { CvData } from "@/lib/cv-data";
import { Hero, Profile, Skills, Experience, Projects, Education, Contact } from "./sections";
import "./cv.css";

// Premium easing: fast acceleration, long deceleration — the "confident" feel.
const EASE = "power4.out";
const EASE_SOFT = "power3.out";

export function CvPage({ data }: { data: CvData }) {
  const { locale, setLocale } = useLocale();
  const rootRef = useRef<HTMLDivElement | null>(null);

  // ── Main cinematic animation suite ────────────────────────────────
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: EASE, duration: 1 });

    let ctx: gsap.Context | undefined;
    let onMouseMove: ((e: MouseEvent) => void) | undefined;

    try {
      ctx = gsap.context(() => {
        /* ── Hero sequence ────────────────────────────────────────── */
        const heroTl = gsap.timeline({ delay: 0.05 });

        // Avatar: clip-path circle expand
        heroTl.fromTo(
          ".cv-avatar-reveal",
          { clipPath: "circle(0% at 50% 50%)" },
          { clipPath: "circle(75% at 50% 50%)", duration: 1.2, ease: "power3.inOut" },
          0,
        );

        // Name: character-by-character reveal
        const chars = root.querySelectorAll<HTMLElement>(".cv-hero .cv-char");
        if (chars.length) {
          heroTl.fromTo(
            chars,
            { opacity: 0, y: 40, rotateX: -60 },
            {
              opacity: 1,
              y: 0,
              rotateX: 0,
              duration: 0.7,
              stagger: 0.03,
              ease: "back.out(1.4)",
              clearProps: "transform",
            },
            0.3,
          );
        }

        // Role, tagline, stats: rise in
        heroTl.fromTo(
          ".cv-hero .cv-rise",
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.85, stagger: 0.07, clearProps: "transform" },
          0.65,
        );

        // Stats: counter animation
        root.querySelectorAll<HTMLElement>(".cv-stat-value[data-count]").forEach((el) => {
          const raw = el.dataset.count ?? "";
          const num = parseFloat(raw.replace(/[^0-9.]/g, ""));
          if (!raw.includes("∞") && !isNaN(num)) {
            const suffix = raw.replace(/[0-9.]/g, "");
            const obj = { v: 0 };
            heroTl.to(
              obj,
              {
                v: num,
                duration: 1.6,
                ease: "power2.out",
                onUpdate() {
                  el.textContent = Math.round(obj.v) + suffix;
                },
              },
              0.8,
            );
          }
        });

        // Scroll indicator: gentle loop
        gsap.to(".cv-hero-scroll-line::after", { yPercent: 200, repeat: -1, duration: 1.8, ease: "none" });

        /* ── Scroll-scrub progress bar ────────────────────────────── */
        gsap.to(".cv-progress-bar", {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.3 },
        });

        /* ── Section headers: clip-path wipe reveal ──────────────── */
        root.querySelectorAll<HTMLElement>(".cv-clip-reveal").forEach((el) => {
          gsap.fromTo(
            el,
            { clipPath: "inset(0 100% 0 0)" },
            {
              clipPath: "inset(0 0% 0 0)",
              duration: 1.1,
              ease: "power3.inOut",
              scrollTrigger: { trigger: el, start: "top 88%", once: true },
            },
          );
        });

        // Section index number
        root.querySelectorAll<HTMLElement>(".cv-index-reveal").forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0, scale: 0.5 },
            {
              opacity: 1,
              scale: 1,
              duration: 0.7,
              ease: "back.out(2)",
              scrollTrigger: { trigger: el, start: "top 88%", once: true },
            },
          );
        });

        // Section-level wrapper fade (the outer container)
        root.querySelectorAll<HTMLElement>(".cv-section-reveal").forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 0.6,
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
            },
          );
        });

        /* ── Profile: lead text line stagger ─────────────────────── */
        root.querySelectorAll<HTMLElement>(".cv-lead.cv-reveal").forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.9,
              clearProps: "transform",
              scrollTrigger: { trigger: el, start: "top 88%", once: true },
            },
          );
        });

        /* ── Skill cards: staggered entrance ─────────────────────── */
        root.querySelectorAll<HTMLElement>(".cv-skills.cv-stagger").forEach((group) => {
          gsap.fromTo(
            group.querySelectorAll<HTMLElement>(".cv-stagger-item"),
            { opacity: 0, y: 50, scale: 0.95 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.8,
              stagger: 0.1,
              ease: EASE_SOFT,
              clearProps: "transform",
              scrollTrigger: { trigger: group, start: "top 85%", once: true },
            },
          );
        });

        /* ── Card hover: perspective tilt + shadow ───────────────── */
        if (!reduced && window.matchMedia("(pointer: fine)").matches) {
          onMouseMove = (e: MouseEvent) => {
            root.querySelectorAll<HTMLElement>(".cv-card-hover").forEach((card) => {
              const r = card.getBoundingClientRect();
              const cx = r.left + r.width / 2;
              const cy = r.top + r.height / 2;
              const dx = (e.clientX - cx) / (r.width / 2);
              const dy = (e.clientY - cy) / (r.height / 2);
              const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
              const maxDist = 360;
              if (dist < maxDist) {
                const t = 1 - dist / maxDist;
                gsap.to(card, {
                  rotateY: dx * 3 * t,
                  rotateX: -dy * 3 * t,
                  duration: 0.5,
                  ease: "power2.out",
                  overwrite: "auto",
                });
              } else {
                gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.6, overwrite: "auto" });
              }
            });
          };
          window.addEventListener("mousemove", onMouseMove, { passive: true });
        }

        /* ── Reveal blocks (experience, contact, generic) ────────── */
        root.querySelectorAll<HTMLElement>(".cv-reveal").forEach((el) => {
          // Skip if already handled by a more specific animation
          if (el.classList.contains("cv-lead")) return;
          gsap.fromTo(
            el,
            { opacity: 0, y: 32 },
            {
              opacity: 1,
              y: 0,
              duration: 0.9,
              clearProps: "transform",
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
            },
          );
        });

        /* ── Timeline: draw line on scroll ───────────────────────── */
        const line = root.querySelector<HTMLElement>(".cv-timeline-line");
        if (line) {
          gsap.fromTo(
            line,
            { scaleY: 0 },
            {
              scaleY: 1,
              transformOrigin: "top center",
              ease: "none",
              scrollTrigger: {
                trigger: ".cv-timeline",
                start: "top 72%",
                end: "bottom 78%",
                scrub: 0.6,
              },
            },
          );
        }

        /* ── Projects: staggered grid entrance ───────────────────── */
        root.querySelectorAll<HTMLElement>(".cv-projects.cv-stagger").forEach((group) => {
          gsap.fromTo(
            group.querySelectorAll<HTMLElement>(".cv-stagger-item"),
            { opacity: 0, y: 40, scale: 0.96 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.8,
              stagger: 0.1,
              ease: EASE_SOFT,
              clearProps: "transform",
              scrollTrigger: { trigger: group, start: "top 85%", once: true },
            },
          );
        });

        /* ── Education: stagger ──────────────────────────────────── */
        root.querySelectorAll<HTMLElement>(".cv-edu.cv-stagger").forEach((group) => {
          gsap.fromTo(
            group.querySelectorAll<HTMLElement>(".cv-stagger-item"),
            { opacity: 0, y: 28 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              stagger: 0.08,
              clearProps: "transform",
              scrollTrigger: { trigger: group, start: "top 88%", once: true },
            },
          );
        });

        /* ── Contact chips: stagger with subtle rotate ───────────── */
        root.querySelectorAll<HTMLElement>(".cv-contact-list.cv-stagger").forEach((group) => {
          gsap.fromTo(
            group.querySelectorAll<HTMLElement>(".cv-stagger-item"),
            { opacity: 0, y: 20, rotate: -3 },
            {
              opacity: 1,
              y: 0,
              rotate: 0,
              duration: 0.65,
              stagger: 0.06,
              clearProps: "transform",
              scrollTrigger: { trigger: group, start: "top 88%", once: true },
            },
          );
        });

        /* ── Footer: fade in ─────────────────────────────────────── */
        gsap.fromTo(
          ".cv-foot.cv-reveal",
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            clearProps: "transform",
            scrollTrigger: { trigger: ".cv-foot", start: "top 94%", once: true },
          },
        );

        // Hero glow parallax (desktop pointers only)
        if (!reduced && window.matchMedia("(pointer: fine)").matches) {
          gsap.to(".cv-hero-glow", {
            yPercent: 28,
            ease: "none",
            scrollTrigger: { trigger: ".cv-hero", start: "top top", end: "bottom top", scrub: true },
          });
        }

        requestAnimationFrame(() => ScrollTrigger.refresh());
      }, root);

      // Safety net: any reveal still hidden after timeout gets forced visible.
      const safety = window.setTimeout(() => {
        root
          .querySelectorAll<HTMLElement>(
            ".cv-reveal, .cv-stagger-item, .cv-rise, .cv-clip-reveal, .cv-index-reveal, .cv-char, .cv-avatar-reveal",
          )
          .forEach((el) => {
            if (getComputedStyle(el).opacity === "0" || getComputedStyle(el).clipPath !== "none") {
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
      // If anything fails, never leave content hidden.
      root
        .querySelectorAll<HTMLElement>(
          ".cv-reveal, .cv-rise, .cv-stagger-item, .cv-clip-reveal, .cv-index-reveal, .cv-char, .cv-avatar-reveal",
        )
        .forEach((el) => {
          el.style.opacity = "1";
          el.style.transform = "none";
          el.style.clipPath = "none";
        });
    }
  }, []);

  // Language swap changes text length → recompute trigger positions.
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
        <style>{`.cv-reveal,.cv-rise,.cv-stagger-item,.cv-clip-reveal,.cv-index-reveal,.cv-char,.cv-avatar-reveal{opacity:1!important;transform:none!important;clip-path:none!important}.cv-timeline-line{transform:scaleY(1)!important}`}</style>
      </noscript>

      {/* Scroll-scrub progress bar */}
      <div className="cv-progress" aria-hidden>
        <div className="cv-progress-bar" />
      </div>

      <div className="cv-topbar">
        {/* Absolute URL: on the cv subdomain this must leave to the main site. */}
        <a href={siteConfig.url} className="cv-tb-btn cv-back" aria-label={en ? "Back to site" : "返回站点"}>
          <ArrowLeft className="cv-tb-icon" aria-hidden />
          <span>{en ? "Back" : "返回"}</span>
        </a>
        <button
          type="button"
          className="cv-tb-btn cv-lang"
          onClick={toggleLocale}
          aria-label={en ? "Switch to Chinese" : "切换为英文"}
        >
          <Languages className="cv-tb-icon" aria-hidden />
          <span>{en ? "中文" : "EN"}</span>
        </button>
      </div>

      <main className="cv-main">
        <Hero locale={locale} data={data} />
        <div className="cv-body">
          <Profile locale={locale} data={data} />
          <Skills locale={locale} data={data} />
          <Experience locale={locale} data={data} />
          <Projects locale={locale} data={data} />
          <Education locale={locale} data={data} />
          <Contact locale={locale} data={data} />
        </div>
      </main>
    </div>
  );
}
