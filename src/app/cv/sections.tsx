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

/* ── Character split for cinematic text reveals ─────────────────── */
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

function SectionHeader({ index, kicker, title }: { index: string; kicker: string; title: string }) {
  return (
    <div className="cv-section-head cv-section-reveal">
      <span className="cv-section-index cv-index-reveal" aria-hidden>{index}</span>
      <div className="cv-section-heading">
        <span className="cv-kicker">{kicker}</span>
        <h2 className="cv-section-title cv-clip-reveal">{title}</h2>
      </div>
    </div>
  );
}

/* ── Hero ───────────────────────────────────────────────────────── */
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

/* ── Profile / Summary ──────────────────────────────────────────── */
export function Profile({ locale, data }: SectionProps) {
  return (
    <section className="cv-section" id="profile">
      <SectionHeader index="01" kicker="PROFILE" title={isEn(locale) ? "Profile" : "关于"} />
      <p className="cv-lead cv-reveal">{pick(data.summary, locale)}</p>
    </section>
  );
}

/* ── Skills — flowing chip bars, no cards ───────────────────────── */
export function Skills({ locale, data }: SectionProps) {
  return (
    <section className="cv-section" id="skills">
      <SectionHeader index="02" kicker="SKILLS" title={isEn(locale) ? "Skills" : "技能"} />
      <div className="cv-skills">
        {data.skills.map((g, i) => (
          <div key={i} className="cv-skill-row cv-reveal">
            <h3 className="cv-skill-cat">{pick(g.name, locale)}</h3>
            <div className="cv-skill-chips">
              {g.items.map((it, j) => (
                <span key={it} className="cv-chip" style={{ "--chip-i": j } as React.CSSProperties}>{it}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Experience — two-column sticky timeline ────────────────────── */
export function Experience({ locale, data }: SectionProps) {
  return (
    <section className="cv-section" id="experience">
      <SectionHeader index="03" kicker="EXPERIENCE" title={isEn(locale) ? "Experience" : "经历"} />
      <div className="cv-exp">
        {data.experience.map((exp, i) => (
          <article key={i} className="cv-exp-item">
            <div className="cv-exp-left cv-reveal">
              <span className="cv-exp-period">{pick(exp.period, locale)}</span>
              <span className="cv-exp-company">{pick(exp.company, locale)}</span>
              <span className="cv-exp-dot" aria-hidden />
            </div>
            <div className="cv-exp-right cv-reveal">
              <h3 className="cv-exp-role">{pick(exp.role, locale)}</h3>
              {exp.location ? <p className="cv-exp-loc">{pick(exp.location, locale)}</p> : null}
              {exp.summary ? <p className="cv-exp-summary">{pick(exp.summary, locale)}</p> : null}
              {exp.highlights.length ? (
                <ul className="cv-exp-highlights">
                  {exp.highlights.map((h, j) => (
                    <li key={j}>{pick(h, locale)}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ── Projects ───────────────────────────────────────────────────── */
export function Projects({ locale, data }: SectionProps) {
  return (
    <section className="cv-section" id="projects">
      <SectionHeader index="04" kicker="PROJECTS" title={isEn(locale) ? "Projects" : "项目"} />
      <div className="cv-projects cv-stagger">
        {data.projects.map((p, i) => {
          const inner = (
            <>
              <div className="cv-project-top">
                <h3 className="cv-project-name">{pick(p.name, locale)}</h3>
                {p.href ? <ArrowUpRight className="cv-project-arrow" aria-hidden /> : null}
              </div>
              <p className="cv-project-desc">{pick(p.description, locale)}</p>
              <div className="cv-project-foot">
                <ul className="cv-project-stack">
                  {p.stack.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                {p.year ? <span className="cv-project-year">{p.year}</span> : null}
              </div>
            </>
          );
          return p.href ? (
            <a
              key={i}
              href={p.href}
              target="_blank"
              rel="noreferrer noopener"
              className="cv-project cv-stagger-item cv-card-hover"
            >
              {inner}
            </a>
          ) : (
            <div key={i} className="cv-project cv-stagger-item cv-card-hover">
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── Education ──────────────────────────────────────────────────── */
export function Education({ locale, data }: SectionProps) {
  return (
    <section className="cv-section" id="education">
      <SectionHeader index="05" kicker="EDUCATION" title={isEn(locale) ? "Education" : "教育"} />
      <div className="cv-edu cv-stagger">
        {data.education.map((e, i) => (
          <article key={i} className="cv-edu-item cv-stagger-item">
            <p className="cv-edu-period">{pick(e.period, locale)}</p>
            <div className="cv-edu-body">
              <h3 className="cv-edu-school">{pick(e.school, locale)}</h3>
              <p className="cv-edu-degree">{pick(e.degree, locale)}</p>
              {e.detail ? <p className="cv-edu-detail">{pick(e.detail, locale)}</p> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ── Contact ────────────────────────────────────────────────────── */
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
    <section className="cv-section cv-contact" id="contact">
      <SectionHeader index="06" kicker="CONTACT" title={isEn(locale) ? "Contact" : "联系"} />
      <p className="cv-contact-lead cv-reveal">
        {isEn(locale) ? "Let's build something together." : "如果合拍,欢迎随时联系。"}
      </p>
      <ul className="cv-contact-list cv-stagger">
        {data.contacts.map((c, i) => {
          const Icon = CONTACT_ICON[c.type];
          const body = (
            <>
              <Icon className="cv-contact-icon" aria-hidden />
              <span className="cv-contact-value">{c.value}</span>
            </>
          );
          return (
            <li key={i} className="cv-stagger-item">
              {c.href ? (
                <a
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel={c.href.startsWith("http") ? "noreferrer noopener" : undefined}
                  className="cv-contact-link"
                >
                  {body}
                </a>
              ) : (
                <span className="cv-contact-link cv-contact-static">{body}</span>
              )}
            </li>
          );
        })}
      </ul>
      <footer className="cv-foot cv-reveal">
        &copy; {year} {name} &middot; {isEn(locale) ? "Built with Next.js" : "由 Next.js 构建"}
      </footer>
    </section>
  );
}
