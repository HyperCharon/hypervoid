"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from "react";
import { ArrowRight, Layers3, Radio } from "lucide-react";
import { gsap } from "gsap";
import type { PublicSeries } from "@/lib/series-public";
import { useT } from "@/components/LocaleProvider";

const GLOW_COLOR = "167, 139, 250";
const PARTICLE_COUNT = 10;
const SPOTLIGHT_RADIUS = 280;

function isAnimationDisabled() {
  if (typeof window === "undefined") return true;
  return window.innerWidth <= 768 || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isLightMode() {
  if (typeof window === "undefined") return false;
  return document.documentElement.classList.contains("light");
}

function createParticle(x: number, y: number) {
  const el = document.createElement("span");
  el.className = "hv-magic-particle";
  el.style.left = x + "px";
  el.style.top = y + "px";
  return el;
}

function updateGlow(card: HTMLElement, clientX: number, clientY: number, intensity: number) {
  const rect = card.getBoundingClientRect();
  const x = ((clientX - rect.left) / Math.max(rect.width, 1)) * 100;
  const y = ((clientY - rect.top) / Math.max(rect.height, 1)) * 100;
  card.style.setProperty("--glow-x", x + "%");
  card.style.setProperty("--glow-y", y + "%");
  card.style.setProperty("--glow-intensity", intensity.toString());
}

function TopicCard({ item, index }: { item: PublicSeries; index: number }) {
  const cardRef = useRef<HTMLAnchorElement | null>(null);
  const particlesRef = useRef<HTMLElement[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const featured = index === 0;

  const clearParticles = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    particlesRef.current.forEach((particle) => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.22,
        ease: "back.in(1.4)",
        onComplete: () => particle.remove(),
      });
    });
    particlesRef.current = [];
  }, []);

  const spawnParticles = useCallback(() => {
    const card = cardRef.current;
    if (!card || isAnimationDisabled()) return;
    const rect = card.getBoundingClientRect();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const timer = setTimeout(() => {
        if (!cardRef.current) return;
        const particle = createParticle(Math.random() * rect.width, Math.random() * rect.height);
        cardRef.current.appendChild(particle);
        particlesRef.current.push(particle);
        gsap.fromTo(particle, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.2, ease: "back.out(1.5)" });
        gsap.to(particle, {
          x: (Math.random() - 0.5) * 88,
          y: (Math.random() - 0.5) * 88,
          rotation: Math.random() * 360,
          opacity: 0.28,
          duration: 1.4 + Math.random() * 1.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }, i * 70);
      timersRef.current.push(timer);
    }
  }, []);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    const cardEl = element;

    function onEnter() {
      if (isAnimationDisabled()) return;
      spawnParticles();
    }

    function onMove(event: MouseEvent) {
      if (isAnimationDisabled()) return;
      const rect = cardEl.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      gsap.to(cardEl, {
        rotateX: ((y - centerY) / Math.max(centerY, 1)) * -5,
        rotateY: ((x - centerX) / Math.max(centerX, 1)) * 5,
        x: (x - centerX) * 0.018,
        y: (y - centerY) * 0.018,
        duration: 0.18,
        ease: "power2.out",
        transformPerspective: 900,
      });
    }

    function onLeave() {
      clearParticles();
      gsap.to(cardEl, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.25, ease: "power2.out" });
    }

    function onClick(event: MouseEvent) {
      if (isAnimationDisabled()) return;
      const rect = cardEl.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height),
      );
      const ripple = document.createElement("span");
      ripple.className = "hv-magic-ripple";
      ripple.style.width = maxDistance * 2 + "px";
      ripple.style.height = maxDistance * 2 + "px";
      ripple.style.left = x - maxDistance + "px";
      ripple.style.top = y - maxDistance + "px";
      cardEl.appendChild(ripple);
      gsap.fromTo(ripple, { opacity: 0.72, scale: 0 }, { opacity: 0, scale: 1, duration: 0.7, ease: "power2.out", onComplete: () => ripple.remove() });
    }

    cardEl.addEventListener("mouseenter", onEnter);
    cardEl.addEventListener("mousemove", onMove);
    cardEl.addEventListener("mouseleave", onLeave);
    cardEl.addEventListener("click", onClick);
    return () => {
      cardEl.removeEventListener("mouseenter", onEnter);
      cardEl.removeEventListener("mousemove", onMove);
      cardEl.removeEventListener("mouseleave", onLeave);
      cardEl.removeEventListener("click", onClick);
      clearParticles();
    };
  }, [clearParticles, spawnParticles]);

  return (
    <Link
      ref={cardRef}
      href={"/series/" + encodeURIComponent(item.name)}
      className={["hv-magic-bento-card group", featured ? "is-featured" : ""].filter(Boolean).join(" ")}
      style={{ "--glow-color": GLOW_COLOR } as CSSProperties}
    >
      {item.cover ? (
        <Image
          src={item.cover}
          alt=""
          fill
          sizes={featured ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"}
          className="object-cover opacity-[0.44] saturate-[0.78] transition duration-500 group-hover:scale-105 group-hover:opacity-[0.64] group-hover:saturate-100"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,var(--accent-glow),transparent_38%),linear-gradient(135deg,rgba(255,255,255,.06),transparent)]" />
      )}
      <div className="hv-magic-bento-scan" aria-hidden />
      <div className="hv-magic-bento-content">
        <div className="flex items-center justify-between gap-3">
          <span className="hv-magic-bento-label">{featured ? "Featured" : "Series"}</span>
          <span className="hv-magic-bento-count">{item.count} Articles</span>
        </div>
        <div className="mt-auto">
          <h3 className={featured ? "text-xl font-black text-foreground sm:text-2xl" : "text-sm font-bold text-foreground sm:text-base"}>{item.name}</h3>
          {item.description ? <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-muted">{item.description}</p> : null}
          <span className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-accent-soft">
            Open route <ArrowRight className="h-3 w-3" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function TopicMagicBento({ series }: { series: PublicSeries[] }) {
  const t = useT();
  const sectionRef = useRef<HTMLElement | null>(null);
  const items = useMemo(() => series.slice(0, 6), [series]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || isAnimationDisabled() || isLightMode()) return;
    const sectionEl = section;
    const cards = Array.from(sectionEl.querySelectorAll<HTMLElement>(".hv-magic-bento-card"));

    function onMove(event: MouseEvent) {
      const rect = sectionEl.getBoundingClientRect();
      const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      sectionEl.style.setProperty("--spotlight-opacity", inside ? "1" : "0");
      sectionEl.style.setProperty("--spotlight-x", event.clientX - rect.left + "px");
      sectionEl.style.setProperty("--spotlight-y", event.clientY - rect.top + "px");
      for (const card of cards) {
        const cardRect = card.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
        const effective = Math.max(0, distance);
        const proximity = SPOTLIGHT_RADIUS * 0.5;
        const fade = SPOTLIGHT_RADIUS * 0.78;
        const intensity = effective <= proximity ? 1 : effective <= fade ? (fade - effective) / (fade - proximity) : 0;
        updateGlow(card, event.clientX, event.clientY, intensity);
      }
    }

    function onLeave() {
      sectionEl.style.setProperty("--spotlight-opacity", "0");
      cards.forEach((card) => card.style.setProperty("--glow-intensity", "0"));
    }

    document.addEventListener("mousemove", onMove, { passive: true });
    sectionEl.addEventListener("mouseleave", onLeave);
    return () => {
      document.removeEventListener("mousemove", onMove);
      sectionEl.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <section ref={sectionRef} className="hv-magic-bento-section">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-7 w-7 place-items-center border border-accent/30 bg-card text-accent" style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)" }}>
            <Layers3 className="h-3.5 w-3.5" aria-hidden />
          </div>
          <h2 className="font-mono text-lg font-bold uppercase tracking-tight text-foreground sm:text-xl">{t.home.topicSeries}</h2>
        </div>
        <Link href="/series" className="hv-action-compact group inline-flex items-center gap-1.5 border border-border bg-card px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wider text-accent-soft transition hover:border-accent/40 hover:bg-card-hover hover:text-accent">
          {t.home.seeAll}
          <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>

      <div className="hv-magic-bento-grid">
        {items.map((item, index) => <TopicCard key={item.slug} item={item} index={index} />)}
        {items.length === 0 ? (
          <div className="hv-magic-bento-empty">
            <Radio className="h-8 w-8 text-accent-soft" aria-hidden />
            <span>No topic routes</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
