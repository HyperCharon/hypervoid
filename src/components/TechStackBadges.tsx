/**
 * Two-tone shields.io-style badges. Each pill is split into a dark
 * "label" half (with an icon) and a colored "value" half. Matches the
 * style seen in many Hexo/Hugo themes' footer credits.
 *
 * The pills are vector — no PNG/JPG hits the network. On mobile the
 * row wraps and shrinks (smaller padding + text) so it doesn't bloat
 * the footer height.
 */

type IconKey =
  | "vercel"
  | "github"
  | "next"
  | "tailwind"
  | "neon"
  | "claude"
  | "cc"
  | "react"
  | "typescript";

const ICONS: Record<IconKey, React.ReactNode> = {
  vercel: (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
      <path d="M12 2L2 20h20L12 2z" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.03c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.4-5.25 5.69.41.35.78 1.05.78 2.11v3.13c0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  ),
  next: (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
      <path d="M11.572 0c-.176.001-.31.014-.499.034C7.36.434 3.928 2.39 1.756 5.405A11.945 11.945 0 0 0 .063 10.5c-.05.36-.06.46-.06 1.5 0 1.04.01 1.14.06 1.5.34 2.34 1.16 4.34 2.46 6.04 2.28 2.97 5.6 4.74 9.27 4.95.45.025 1.39.014 1.83-.022 1.6-.13 3.04-.55 4.45-1.31.21-.11.26-.15.23-.18a72.79 72.79 0 0 1-.85-1.13l-.83-1.1-1.04-1.54a235.5 235.5 0 0 0-2.06-3.05l-1.04-1.51-.01 2.92c0 1.61-.01 2.94-.02 2.96 0 .03-.04.04-.06.07-.07.04-.13.05-.32.05h-.26l-.07-.04-.05-.04-.01-3.62-.01-3.62-.07-.09a.43.43 0 0 0-.16-.13c-.06-.03-.09-.03-.45-.03h-.39l-.05.03a.4.4 0 0 0-.13.13l-.04.07v8.93l.05.07a.36.36 0 0 0 .15.13c.05.03.07.03.4.03.34 0 .36 0 .42-.03l.16-.13.04-.07.02-2.95.01-2.95 4.51 6.84.04.04.05.05c.04.04.07.05.13.06.08.01.13.01.21-.02.06-.02.13-.07.36-.23 1.41-.93 2.55-2.12 3.4-3.55a11.93 11.93 0 0 0 1.71-5.95c.05-.36.06-.46.06-1.5 0-1.04-.01-1.14-.06-1.5C23.34 4.84 19.86 1.32 15.5.34c-.7-.16-1.39-.27-2.21-.32-.21-.01-1.51-.02-1.72-.02zm5.78 7.27c.1.05.18.13.23.24.04.07.04.27.04 4.84v4.74l-.83-1.27-3.79-5.79c-.06-.09-.06-.09-.05-.13.01-.04.04-.07.07-.09l.04-.02h2.13l2.14.01z" />
    </svg>
  ),
  tailwind: (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
      <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z" />
    </svg>
  ),
  neon: (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <ellipse cx="12" cy="6" rx="9" ry="3" />
      <path d="M3 6v6c0 1.66 4.03 3 9 3s9-1.34 9-3V6" />
      <path d="M3 12v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6" />
    </svg>
  ),
  claude: (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
      <path d="M4.5 18l3.75-9 3.75 9-1.2 0L9 14.7H7.5L6.6 18zm3.3-4.5h1.5L8.55 11l-.75 2.5zM16.5 6L20.25 15 16.5 24l-1.2 0-2.4-6L10.5 24h-1.2L13.05 15 9.3 6h1.2l2.4 6 2.4-6z" />
    </svg>
  ),
  cc: (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z" />
      <path d="M8.5 9.6c0-1.1.9-2 2-2 .6 0 1.1.3 1.5.7l1-.7c-.6-.7-1.5-1.2-2.5-1.2-1.9 0-3.5 1.6-3.5 3.5v3c0 1.9 1.6 3.5 3.5 3.5 1 0 1.9-.5 2.5-1.2l-1-.7c-.4.5-.9.7-1.5.7-1.1 0-2-.9-2-2v-3.6zm7 0c0-1.1.9-2 2-2 .6 0 1.1.3 1.5.7l1-.7c-.6-.7-1.5-1.2-2.5-1.2-1.9 0-3.5 1.6-3.5 3.5v3c0 1.9 1.6 3.5 3.5 3.5 1 0 1.9-.5 2.5-1.2l-1-.7c-.4.5-.9.7-1.5.7-1.1 0-2-.9-2-2v-3.6z" />
    </svg>
  ),
  react: (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="2" />
      <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.2" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.2" transform="rotate(120 12 12)" />
    </svg>
  ),
  typescript: (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
      <path d="M3 3h18v18H3V3zm9.5 13v2.3c.4.2 1 .4 1.5.4.6 0 1-.1 1.3-.3.3-.2.5-.5.5-.9 0-.3-.1-.6-.3-.8-.2-.2-.6-.4-1.2-.6-.8-.3-1.3-.6-1.6-1-.3-.3-.4-.7-.4-1.2 0-.6.2-1.1.7-1.4.4-.4 1-.5 1.7-.5.5 0 1 .1 1.5.2v1.6c-.4-.2-.9-.4-1.3-.4-.4 0-.7.1-.9.2-.2.2-.3.4-.3.6 0 .3.1.5.3.6.2.2.6.3 1.1.5.8.3 1.4.6 1.7 1s.5.8.5 1.4c0 .7-.2 1.2-.7 1.5-.5.4-1.1.6-1.9.6-.6 0-1.2-.1-1.8-.3v-1.5zm-2.7-5h-2v6.7H6.6v-6.7H4.7v-1.5h5.1V11z" />
    </svg>
  ),
};

type Badge = {
  label: string;
  value: string;
  icon: IconKey;
  href?: string;
  /** Tailwind class for the right (value) half background. */
  color: string;
  /** Tailwind class for the value text — defaults to white. */
  text?: string;
};

const BADGES: Badge[] = [
  {
    label: "CDN",
    value: "Vercel",
    icon: "vercel",
    href: "https://vercel.com",
    color: "bg-foreground",
    text: "text-background",
  },
  {
    label: "Hosted",
    value: "Vercel",
    icon: "vercel",
    href: "https://vercel.com",
    color: "bg-emerald-500",
  },
  {
    label: "DB",
    value: "Neon",
    icon: "neon",
    href: "https://neon.tech",
    color: "bg-teal-500",
  },
  {
    label: "Source",
    value: "GitHub",
    icon: "github",
    href: "https://github.com/HyperCharon/hypervoid",
    color: "bg-purple-500",
  },
  {
    label: "Framework",
    value: "Next.js 16",
    icon: "next",
    href: "https://nextjs.org",
    color: "bg-foreground",
    text: "text-background",
  },
  {
    label: "UI",
    value: "Tailwind v4",
    icon: "tailwind",
    href: "https://tailwindcss.com",
    color: "bg-sky-500",
  },
  {
    label: "AI",
    value: "Claude",
    icon: "claude",
    href: "https://www.anthropic.com",
    color: "bg-accent",
  },
  {
    label: "License",
    value: "BY-NC-SA 4.0",
    icon: "cc",
    href: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    color: "bg-accent",
  },
];

function BadgeChip({ badge }: { badge: Badge }) {
  const inner = (
    <span className="inline-flex select-none overflow-hidden rounded-md text-xs font-medium leading-none shadow-sm ring-1 ring-black/10 sm:text-[11px]">
      <span className="inline-flex items-center gap-1 bg-card px-1.5 py-1 text-muted sm:px-2 sm:py-1.5">
        <span className="opacity-90">{ICONS[badge.icon]}</span>
        <span className="tracking-wide">{badge.label}</span>
      </span>
      <span
        className={`inline-flex items-center px-1.5 py-1 sm:px-2 sm:py-1.5 ${badge.color} ${badge.text ?? "text-white"}`}
      >
        {badge.value}
      </span>
    </span>
  );
  return badge.href ? (
    <a
      href={badge.href}
      target="_blank"
      rel="noreferrer noopener"
      title={`${badge.label} · ${badge.value}`}
      className="inline-block transition hover:-translate-y-0.5 hover:opacity-90"
    >
      {inner}
    </a>
  ) : (
    inner
  );
}

const BADGE_ROWS = [
  BADGES.slice(0, 4),
  BADGES.slice(4, 7),
  BADGES.slice(7),
];

export function TechStackBadges() {
  return (
    <div aria-label="技术栈" className="flex flex-col items-center gap-1.5 sm:gap-2">
      {BADGE_ROWS.map((row, index) => (
        <div
          key={index}
          className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2"
        >
          {row.map((b) => (
            <BadgeChip key={b.label} badge={b} />
          ))}
        </div>
      ))}
    </div>
  );
}
