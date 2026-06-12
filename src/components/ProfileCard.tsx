import { SocialIcon } from "@/components/SocialIcon";
import { Avatar } from "@/components/Avatar";
import { BorderGlow } from "@/components/BorderGlow";
import { siteConfig } from "@/lib/site-config";
import { getSiteOverride } from "@/lib/site-config-server";

export async function ProfileCard() {
  const [name, handle, bio, avatar] = await Promise.all([
    getSiteOverride("author.name"),
    getSiteOverride("author.handle"),
    getSiteOverride("author.bio"),
    getSiteOverride("author.avatar"),
  ]);
  const socials = siteConfig.socials.filter(
    (s) => !("hideFromProfile" in s && s.hideFromProfile),
  );
  return (
    <BorderGlow
      colors={["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef", "#ec4899"]}
      glowColor="99 102 241"
      backgroundColor="rgba(8,11,20,0.8)"
      lightBackgroundColor="#fffcf5"
      borderRadius={20}
      edgeSensitivity={25}
      glowRadius={40}
    >
      <aside className="hv-grad-profile group relative overflow-hidden p-6 text-center backdrop-blur-[32px] saturate-[1.6] sm:p-8">
        {/* Decorative corner lines */}
        <div aria-hidden className="hv-profile-line-tl pointer-events-none absolute left-0 top-0 h-px w-28" />
        <div aria-hidden className="hv-profile-line-bl pointer-events-none absolute left-0 top-0 h-28 w-px" />
        <div aria-hidden className="hv-profile-line-tr pointer-events-none absolute bottom-0 right-0 h-px w-28" />
        <div aria-hidden className="hv-profile-line-br pointer-events-none absolute bottom-0 right-0 h-28 w-px" />

        {/* Avatar — larger */}
        <div className="relative mx-auto h-28 w-28 sm:h-32 sm:w-32">
          <div
            aria-hidden
            className="hv-profile-glow absolute -inset-4 rounded-full blur-3xl transition-all duration-500"
          />
          <Avatar
            src={avatar}
            alt={`${name} avatar`}
            name={name}
            className="hv-avatar-ring relative h-28 w-28 rounded-full border-2 border-white/10 sm:h-32 sm:w-32"
          />
        </div>

        {/* Name with gradient text for readability */}
        <h2 className="hv-profile-name mt-4 text-xl font-bold tracking-tight sm:text-2xl">{name}</h2>
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-accent/70 sm:text-sm">@{handle}</p>
        <div className="hv-spectrum-line-fade mx-auto mt-3 h-px w-28" />
        <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted sm:text-base" style={{ textShadow: "var(--text-shadow-subtle)" }}>{bio}</p>

        {/* Social icons — wrap instead of clip when they exceed card width */}
        <div className="mt-4 flex items-center justify-center gap-1 sm:mt-5 sm:gap-2">
          {socials.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noreferrer noopener"
              title={s.name}
              aria-label={s.name}
              className="hv-grad-social inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:shadow-[0_0_20px_var(--rainbow-glow)] sm:h-10 sm:w-10"
            >
              <SocialIcon name={s.icon} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </a>
          ))}
        </div>
      </aside>
    </BorderGlow>
  );
}
