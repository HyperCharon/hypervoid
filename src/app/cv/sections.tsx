import Image from "next/image";
import {
  Mail,
  GitBranch,
  Globe,
  MapPin,
  Phone,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { pick, type CvContactType, type CvData } from "@/lib/cv-data";

const isEn = (l: Locale) => l === "en";

type SectionProps = { locale: Locale; data: CvData };

/* ── Character split ────────────────────────────────────────────── */
function TextSplit({ text }: { text: string }) {
  return (
    <span className="cv-name-split" aria-label={text}>
      {text.split("").map((ch, i) => (
        <span key={i} className="cv-char" aria-hidden>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}

/* ── Hero — full viewport cinematic entrance ────────────────────── */
export function Hero({ locale, data }: SectionProps) {
  const id = data.identity;
  return (
    <header className="cv-hero">
      <div className="cv-hero-bg" aria-hidden>
        <canvas className="cv-hero-particles" />
        <div className="cv-hero-grid" />
        <div className="cv-hero-glow" />
        <div className="cv-hero-glow cv-hero-glow-2" />
        <div className="cv-hero-vignette" />
      </div>

      <div className="cv-hero-inner">
        <div className="cv-hero-avatar cv-avatar-reveal" aria-hidden>
          <Image src={id.avatar} alt="" width={132} height={132} priority className="cv-hero-avatar-img" />
          <span className="cv-hero-avatar-ring" />
        </div>

        <p className="cv-hero-kicker cv-rise">{isEn(locale) ? "Curriculum Vitae" : "个人简历"}</p>
        <h1 className="cv-hero-name">
          <TextSplit text={pick(id.name, locale)} />
        </h1>

        <div className="cv-hero-role cv-rise">
          <span className="cv-hero-role-text">{pick(id.role, locale)}</span>
          <span className="cv-hero-avail">
            <span className="cv-dot" aria-hidden />
            {pick(id.available, locale)}
          </span>
        </div>

        <p className="cv-hero-tagline cv-rise">{pick(id.tagline, locale)}</p>

        <ul className="cv-hero-stats cv-rise">
          {data.stats.map((s, i) => (
            <li key={i} className="cv-stat">
              <span className="cv-stat-value" data-count={s.value}>{s.value}</span>
              <span className="cv-stat-label">{pick(s.label, locale)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="cv-hero-scroll cv-rise" aria-hidden>
        <span className="cv-hero-scroll-label">{isEn(locale) ? "Scroll" : "向下滚动"}</span>
        <span className="cv-hero-scroll-line" />
      </div>
    </header>
  );
}

/* ── Dashboard — spatial grid, all sections at once ─────────────── */
export function Dashboard({ locale, data }: SectionProps) {
  return (
    <section className="cv-dash">
      <div className="cv-dash-inner">
        {/* Stats strip */}
        <div className="cv-dash-stats cv-dash-panel">
          {data.stats.map((s, i) => (
            <div key={i} className="cv-dash-stat">
              <span className="cv-dash-stat-val" data-count={s.value}>{s.value}</span>
              <span className="cv-dash-stat-lbl">{pick(s.label, locale)}</span>
            </div>
          ))}
        </div>

        {/* Profile + Skills */}
        <div className="cv-dash-panel cv-dash-profile">
          <h2 className="cv-dash-heading">{isEn(locale) ? "Profile" : "关于"}</h2>
          <p className="cv-dash-text">{pick(data.summary, locale)}</p>
        </div>

        <div className="cv-dash-panel cv-dash-skills">
          <h2 className="cv-dash-heading">{isEn(locale) ? "Skills" : "技能"}</h2>
          <div className="cv-dash-bars">
            {data.skills.map((g) => (
              <div key={pick(g.name, locale)} className="cv-dash-bar-group">
                <span className="cv-dash-bar-label">{pick(g.name, locale)}</span>
                <div className="cv-dash-bar-chips">
                  {g.items.map((it) => (
                    <span key={it} className="cv-dash-chip">{it}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Experience + Projects */}
        <div className="cv-dash-panel cv-dash-exp">
          <h2 className="cv-dash-heading">{isEn(locale) ? "Experience" : "经历"}</h2>
          <div className="cv-dash-timeline">
            {data.experience.map((exp, i) => (
              <div key={i} className="cv-dash-tl-item">
                <span className="cv-dash-tl-dot" aria-hidden />
                <div className="cv-dash-tl-head">
                  <span className="cv-dash-tl-period">{pick(exp.period, locale)}</span>
                  <span className="cv-dash-tl-company">{pick(exp.company, locale)}</span>
                </div>
                <p className="cv-dash-tl-role">{pick(exp.role, locale)}</p>
                {exp.summary ? <p className="cv-dash-tl-sum">{pick(exp.summary, locale)}</p> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="cv-dash-panel cv-dash-projects">
          <h2 className="cv-dash-heading">{isEn(locale) ? "Projects" : "项目"}</h2>
          <div className="cv-dash-proj-grid">
            {data.projects.map((p, i) => {
              const card = (
                <div className="cv-dash-proj">
                  <div className="cv-dash-proj-top">
                    <span className="cv-dash-proj-name">{pick(p.name, locale)}</span>
                    {p.year ? <span className="cv-dash-proj-yr">{p.year}</span> : null}
                  </div>
                  <p className="cv-dash-proj-desc">{pick(p.description, locale)}</p>
                  <div className="cv-dash-proj-stack">
                    {p.stack.map((s) => <span key={s}>{s}</span>)}
                  </div>
                </div>
              );
              return p.href ? (
                <a key={i} href={p.href} target="_blank" rel="noreferrer noopener" className="cv-dash-proj-link">
                  {card}
                  <ArrowUpRight className="cv-dash-proj-arrow" aria-hidden />
                </a>
              ) : (
                <div key={i}>{card}</div>
              );
            })}
          </div>
        </div>

        {/* Education */}
        <div className="cv-dash-panel cv-dash-edu">
          <h2 className="cv-dash-heading">{isEn(locale) ? "Education" : "教育"}</h2>
          {data.education.map((e, i) => (
            <div key={i} className="cv-dash-edu-item">
              <span className="cv-dash-edu-period">{pick(e.period, locale)}</span>
              <span className="cv-dash-edu-school">{pick(e.school, locale)}</span>
              <span className="cv-dash-edu-degree">{pick(e.degree, locale)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Contact — full viewport CTA ────────────────────────────────── */
const CONTACT_ICON: Record<CvContactType, LucideIcon> = {
  email: Mail,
  github: GitBranch,
  website: Globe,
  location: MapPin,
  phone: Phone,
  wechat: MessageCircle,
};

export function Contact({ locale, data }: SectionProps) {
  const year = new Date().getFullYear();
  const name = pick(data.identity.name, locale);
  return (
    <section className="cv-contact">
      <div className="cv-contact-inner">
        <h2 className="cv-contact-head">
          {isEn(locale) ? "Let's build\nsomething together." : "如果合拍\n欢迎随时联系。"}
        </h2>
        <ul className="cv-contact-list">
          {data.contacts.map((c, i) => {
            const Icon = CONTACT_ICON[c.type];
            const body = (
              <>
                <Icon className="cv-contact-icon" aria-hidden />
                <span>{c.value}</span>
              </>
            );
            return (
              <li key={i}>
                {c.href ? (
                  <a
                    href={c.href}
                    target={c.href.startsWith("http") ? "_blank" : undefined}
                    rel={c.href.startsWith("http") ? "noreferrer noopener" : undefined}
                    className="cv-contact-chip"
                  >
                    {body}
                  </a>
                ) : (
                  <span className="cv-contact-chip cv-contact-static">{body}</span>
                )}
              </li>
            );
          })}
        </ul>
        <footer className="cv-foot">
          &copy; {year} {name} &middot; {isEn(locale) ? "Built with Next.js" : "由 Next.js 构建"}
        </footer>
      </div>
    </section>
  );
}
