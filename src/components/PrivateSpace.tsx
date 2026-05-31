"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/components/LocaleProvider";

type UserInfo = {
  login: string;
  name: string | null;
  avatar: string | null;
  isAdmin: boolean;
};

export function PrivateSpace() {
  const t = useT();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          setUser({
            login: data.user.login ?? "",
            name: data.user.name ?? null,
            avatar: data.user.image ?? null,
            isAdmin: data.user.isAdmin === true,
          });
        }
      })
      .catch(() => {})
      .finally(() => setMounted(true));
  }, []);

  if (!mounted || !user?.isAdmin) return null;

  return (
    <aside className="hv-panel-sci group relative overflow-hidden p-3">
      {/* Corner accent */}
      <div aria-hidden className="pointer-events-none absolute left-0 top-0 h-px w-16 bg-gradient-to-r from-accent/60 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute left-0 top-0 h-16 w-px bg-gradient-to-b from-accent/60 to-transparent" />

      <div className="flex items-center gap-2.5">
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar}
            alt=""
            className="h-8 w-8 border border-border bg-card object-cover"
            style={{ clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%)' }}
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center border border-accent/30 bg-card font-mono text-sm font-bold text-accent" style={{ clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%)' }}>
            {(user.name || user.login).slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-foreground/80">
            Private_Space
          </h3>
          <p className="truncate font-mono text-xs text-muted">
            {user.name || user.login}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-col gap-0.5">
        <SpaceLink href="/admin" icon="settings" label={t.admin.dashboard} />
        <SpaceLink href="/admin/posts/new" icon="write" label={t.admin.writePost} />
        <SpaceLink href="/admin/series" icon="collection" label={t.admin.manageSeries} />
        <SpaceLink href="/admin/albums" icon="photo" label={t.admin.manageAlbums} />
      </div>
    </aside>
  );
}

function SpaceLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 border border-transparent px-2 py-1 text-xs text-muted transition hover:border-border hover:bg-card-hover hover:text-foreground"
      style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)' }}
    >
      <span className="grid h-5 w-5 place-items-center border border-border bg-card text-accent/70 transition group-hover:border-accent/40 group-hover:bg-card-hover group-hover:text-accent" style={{ clipPath: 'polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 0 100%)' }}>
        <Icon name={icon} />
      </span>
      {label}
    </Link>
  );
}

function Icon({ name }: { name: string }) {
  switch (name) {
    case "settings":
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "write":
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
        </svg>
      );
    case "collection":
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      );
    case "photo":
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      );
    default:
      return null;
  }
}
