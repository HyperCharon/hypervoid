"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { Archive, BookOpenText, Box, CalendarDays, Clapperboard, Code2, Gamepad2, GitBranch, GraduationCap, Handshake, ImageIcon, MessageSquareText, Music2, Network, Pin, Sparkles, Tags, UserRound, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useT } from "@/components/LocaleProvider";
import { siteConfig } from "@/lib/site-config";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
};
type NavGroup = { key: string; label: string; items: NavItem[] };
type DirectLink = { href: string; label: string };

const CLOSE_DELAY = 160;

export function NavGroups() {
  const t = useT();
  const pathname = usePathname();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const activeMarkerRef = useRef<HTMLSpanElement | null>(null);
  const pillRefs = useRef<Array<HTMLElement | null>>([]);
  const labelRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const hoverLabelRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const directLinks: DirectLink[] = [
    { href: "/posts", label: t.nav.posts },
    { href: "/archive", label: t.nav.archive },
  ];

  const SOCIAL_ICON: Record<string, LucideIcon> = {
    github: GitBranch,
    bilibili: Clapperboard,
    gitee: Code2,
    codeberg: Code2,
    steam: Gamepad2,
    douyin: Music2,
  };

  const groups: NavGroup[] = [
    {
      key: "create",
      label: t.nav.groupCreate,
      items: [
        { href: "/projects", label: t.nav.projects, icon: Box },
        { href: "/skills", label: t.nav.skills, icon: GraduationCap },
        { href: "/timeline", label: t.nav.timeline, icon: CalendarDays },
      ],
    },
    {
      key: "life",
      label: t.nav.groupLife,
      items: [
        { href: "/anime", label: t.nav.anime, icon: Clapperboard },
        { href: "/movies", label: t.nav.movies, icon: Clapperboard },
        { href: "/books", label: t.nav.books, icon: BookOpenText },
        { href: "/games", label: t.nav.games, icon: Gamepad2 },
        { href: "/music", label: t.nav.music, icon: Music2 },
        { href: "/albums", label: t.nav.albums, icon: ImageIcon },
        { href: "/diary", label: t.nav.diary, icon: Archive },
      ],
    },
    {
      key: "interact",
      label: t.nav.groupInteract,
      items: [
        { href: "/guestbook", label: t.nav.guestbook, icon: MessageSquareText },
        { href: "/friends", label: t.nav.friends, icon: Handshake },
        { href: "/about", label: t.nav.about, icon: UserRound },
      ],
    },
    {
      key: "featured",
      label: t.nav.groupFeatured,
      items: [
        { href: "/pinned", label: "置顶文章", icon: Pin },
        { href: "/series", label: "系列", icon: BookOpenText },
        { href: "/tags", label: "标签", icon: Tags },
        { href: "/resources", label: "资源库", icon: Wrench },
        { href: "/year-in-review", label: "年度回顾", icon: Sparkles },
        { href: "/posts/random", label: "随机一篇", icon: Sparkles },
      ],
    },
    {
      key: "links",
      label: t.nav.groupLinks,
      items: siteConfig.socials.map((s) => ({
        href: s.url,
        label: s.name,
        icon: SOCIAL_ICON[s.icon] ?? Network,
        external: true,
      })),
    },
  ];

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const openGroup = useCallback((key: string) => {
    clearCloseTimer();
    setOpenKey(key);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpenKey(null), CLOSE_DELAY);
  }, [clearCloseTimer]);

  const closeNow = useCallback(() => {
    clearCloseTimer();
    setOpenKey(null);
  }, [clearCloseTimer]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeNow();
    }
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) closeNow();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [closeNow]);

  useEffect(() => {
    setOpenKey(null);
  }, [pathname]);

  function isHrefActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }
  function isGroupActive(g: NavGroup) {
    return g.items.some((it) => isHrefActive(it.href));
  }

  const directActiveIndex = directLinks.findIndex((link) => isHrefActive(link.href));
  const groupActiveIndex = groups.findIndex((g) => openKey === g.key || isGroupActive(g));
  const activeIndex = directActiveIndex >= 0
    ? directActiveIndex
    : groupActiveIndex >= 0
      ? directLinks.length + groupActiveIndex
      : -1;

  useEffect(() => {
    if (!trackRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        pillRefs.current.filter(Boolean),
        { y: -8, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.46, stagger: 0.035, ease: "power3.out" },
      );
    }, trackRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const marker = activeMarkerRef.current;
    const track = trackRef.current;
    const activeEl = activeIndex >= 0 ? pillRefs.current[activeIndex] : null;
    if (!marker || !track || !activeEl) {
      if (marker) gsap.to(marker, { opacity: 0, duration: 0.16, ease: "power2.out" });
      return;
    }

    const trackRect = track.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    gsap.to(marker, {
      x: activeRect.left - trackRect.left,
      y: activeRect.top - trackRect.top,
      width: activeRect.width,
      height: activeRect.height,
      opacity: 1,
      duration: 0.38,
      ease: "power3.out",
    });
  }, [activeIndex]);

  function setPillRef(index: number) {
    return (node: HTMLElement | null) => {
      pillRefs.current[index] = node;
    };
  }

  function setLabelRef(index: number) {
    return (node: HTMLSpanElement | null) => {
      labelRefs.current[index] = node;
    };
  }

  function setHoverLabelRef(index: number) {
    return (node: HTMLSpanElement | null) => {
      hoverLabelRefs.current[index] = node;
    };
  }

  function animatePillLabel(index: number, hovered: boolean) {
    const label = labelRefs.current[index];
    const hoverLabel = hoverLabelRefs.current[index];
    if (!label || !hoverLabel) return;

    gsap.to(label, { y: hovered ? "-1.35em" : "0em", opacity: hovered ? 0 : 1, duration: 0.24, ease: "power3.out" });
    gsap.to(hoverLabel, { y: hovered ? "0em" : "1.35em", opacity: hovered ? 1 : 0, duration: 0.24, ease: "power3.out" });
  }

  function pillLabel(label: string, index: number) {
    return (
      <span className="hv-pill-label-wrap" aria-hidden="true">
        <span ref={setLabelRef(index)} className="hv-pill-label">{label}</span>
        <span ref={setHoverLabelRef(index)} className="hv-pill-label hv-pill-label-hover">{label}</span>
      </span>
    );
  }

  return (
    <div
      ref={containerRef}
      className="hidden xl:flex xl:items-center"
      onMouseLeave={scheduleClose}
    >
      <div ref={trackRef} className="hv-pill-nav-track">
        <span ref={activeMarkerRef} aria-hidden className="hv-pill-active-marker" />
        {directLinks.map((link, index) => {
          const active = isHrefActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              ref={setPillRef(index)}
              onMouseEnter={() => {
                closeNow();
                animatePillLabel(index, true);
              }}
              onMouseLeave={() => animatePillLabel(index, false)}
              className={`hv-pill-nav-pill ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="sr-only">{link.label}</span>
              {pillLabel(link.label, index)}
            </Link>
          );
        })}

        <span
          aria-hidden
          className="mx-1 h-5 w-px shrink-0 bg-border"
        />

        {groups.map((g) => {
          const isOpen = openKey === g.key;
          const isActive = isGroupActive(g);
          const pillIndex = directLinks.length + groups.findIndex((group) => group.key === g.key);
          return (
            <div
              key={g.key}
              className="relative shrink-0"
              onMouseEnter={() => openGroup(g.key)}
            >
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                onClick={() => (isOpen ? closeNow() : openGroup(g.key))}
                onFocus={() => openGroup(g.key)}
                onMouseEnter={() => animatePillLabel(pillIndex, true)}
                onMouseLeave={() => animatePillLabel(pillIndex, false)}
                ref={setPillRef(pillIndex)}
                className={`hv-pill-nav-pill hv-pill-nav-button ${isOpen || isActive ? "is-active" : ""}`}
              >
                <span className="sr-only">{g.label}</span>
                {pillLabel(g.label, pillIndex)}
                <svg
                  aria-hidden
                  className={`relative z-[3] h-3 w-3 transition ${isOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isOpen ? (
                <div
                  role="menu"
                  className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2"
                >
                  <div className="hv-pill-menu-panel">
                    {g.items.map((item) => {
                      const itemActive = !item.external && isHrefActive(item.href);
                      const ItemIcon = item.icon;
                      const className = `hv-pill-menu-link ${
                        itemActive
                          ? "border-border bg-foreground/5 text-accent"
                          : "text-muted hover:border-border hover:bg-foreground/3 hover:text-foreground"
                      }`;
                      if (item.external) {
                        return (
                          <a
                            key={item.href}
                            href={item.href}
                            target="_blank"
                            rel="noreferrer noopener"
                            role="menuitem"
                            onClick={closeNow}
                            className={className}
                          >
                            <ItemIcon aria-hidden className="h-4 w-4 shrink-0 text-accent-soft" />
                            <span className="whitespace-nowrap">{item.label}</span>
                            <svg
                              aria-hidden
                              className="ml-auto h-3 w-3 shrink-0 opacity-60"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path d="M7 17L17 7M17 7H8M17 7v9" />
                            </svg>
                          </a>
                        );
                      }
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          onClick={closeNow}
                          className={className}
                        >
                          <ItemIcon aria-hidden className="h-4 w-4 shrink-0 text-accent-soft" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
