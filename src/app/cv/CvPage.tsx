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

export function CvPage({ data }: { data: CvData }) {
  const { locale, setLocale } = useLocale();
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Cinematic reveals. Content is hidden via CSS only here; prefers-reduced-motion
  // and no-JS keep everything visible (see cv.css + <noscript> below).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ctx: gsap.Context | undefined;
    try {
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        // Hero: play in on load. clearProps drops the transform layer afterwards
        // so text renders on the pixel grid (no sub-pixel blur).
        gsap.to(".cv-hero .cv-rise", {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.08,
          ease: "power3.out",
          delay: 0.08,
          clearProps: "transform",
        });

        // Section blocks: reveal as they enter. `start: top 92%` + a refreshed
        // ScrollTrigger ensures even short last sections (Contact) clear the
        // threshold; clearProps avoids leftover blur.
        gsap.utils.toArray<HTMLElement>(".cv-reveal").forEach((el) => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            clearProps: "transform",
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          });
        });

        // Staggered groups (skills / projects / contacts).
        gsap.utils.toArray<HTMLElement>(".cv-stagger").forEach((group) => {
          gsap.to(group.querySelectorAll<HTMLElement>(".cv-stagger-item"), {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.07,
            ease: "power3.out",
            clearProps: "transform",
            scrollTrigger: { trigger: group, start: "top 90%", once: true },
          });
        });

        // Timeline: draw the line as you scroll through it.
        const line = root.querySelector<HTMLElement>(".cv-timeline-line");
        if (line) {
          gsap.to(line, {
            scaleY: 1,
            transformOrigin: "top center",
            ease: "none",
            scrollTrigger: { trigger: ".cv-timeline", start: "top 72%", end: "bottom 78%", scrub: 0.6 },
          });
        }

        // Hero glow parallax (desktop pointers only).
        if (window.matchMedia("(pointer: fine)").matches) {
          gsap.to(".cv-hero-glow", {
            yPercent: 28,
            ease: "none",
            scrollTrigger: { trigger: ".cv-hero", start: "top top", end: "bottom top", scrub: true },
          });
        }
      }, root);

      requestAnimationFrame(() => ScrollTrigger.refresh());

      // Safety net: any reveal still hidden shortly after load (short page,
      // trigger never reached) is forced visible so nothing stays cut off.
      const safety = window.setTimeout(() => {
        root.querySelectorAll<HTMLElement>(".cv-reveal, .cv-stagger-item, .cv-rise").forEach((el) => {
          if (getComputedStyle(el).opacity === "0") {
            el.style.opacity = "1";
            el.style.transform = "none";
          }
        });
      }, 1600);

      return () => {
        window.clearTimeout(safety);
        ctx?.revert();
      };
    } catch {
      // If anything fails, never leave content hidden.
      root.querySelectorAll<HTMLElement>(".cv-reveal, .cv-rise, .cv-stagger-item").forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
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
        {/* Keep content visible without JS */}
        <style>{`.cv-reveal,.cv-rise,.cv-stagger-item{opacity:1!important;transform:none!important}.cv-timeline-line{transform:scaleY(1)!important}`}</style>
      </noscript>

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
