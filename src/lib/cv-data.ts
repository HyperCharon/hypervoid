import type { Locale } from "@/lib/i18n";

// ── Bilingual web résumé content ──────────────────────────────────────────
// Everything the /cv page renders lives here so it's trivial to fill in later.
// Each visible string is `{ zh, en }`; pick the active language with `pick()`.
// Placeholder identity is an "engineer" — swap names/dates/links freely.

export type Bi = { zh: string; en: string };

export function pick(value: Bi, locale: Locale): string {
  return locale === "en" ? value.en : value.zh;
}

export type CvContactType = "email" | "github" | "website" | "location" | "phone" | "wechat";
export type CvContact = { type: CvContactType; value: string; href?: string };

export type CvStat = { value: string; label: Bi };
export type CvSkillGroup = { name: Bi; items: string[] };
export type CvExperience = {
  period: Bi;
  company: Bi;
  role: Bi;
  location?: Bi;
  summary?: Bi;
  highlights: Bi[];
};
export type CvProject = { name: Bi; description: Bi; stack: string[]; href?: string; year?: string };
export type CvEducation = { period: Bi; school: Bi; degree: Bi; detail?: Bi };

export type CvData = {
  identity: {
    name: Bi;
    role: Bi;
    tagline: Bi;
    location: Bi;
    avatar: string;
    available: Bi;
  };
  summary: Bi;
  stats: CvStat[];
  skills: CvSkillGroup[];
  experience: CvExperience[];
  projects: CvProject[];
  education: CvEducation[];
  contacts: CvContact[];
};

export const cvData: CvData = {
  identity: {
    name: { zh: "你的名字", en: "Your Name" },
    role: { zh: "工程师", en: "Engineer" },
    tagline: {
      zh: "构建可靠的系统,把复杂留给自己,把简单交给用户。",
      en: "Building reliable systems — keep the complexity, ship the simplicity.",
    },
    location: { zh: "中国 · 远程", en: "China · Remote" },
    avatar: "/avatar.jpg",
    available: { zh: "开放新机会", en: "Open to opportunities" },
  },

  summary: {
    zh: "一名以工程严谨与产品直觉并重的工程师。擅长从零搭建系统、打磨细节与性能,关注可维护性与长期演进。下面的经历与项目为占位示例,替换为你自己的内容即可。",
    en: "An engineer who pairs rigor with product intuition. I build systems from scratch, sweat the details and performance, and care about maintainability over the long run. The roles and projects below are placeholders — swap in your own.",
  },

  stats: [
    { value: "5+", label: { zh: "年经验", en: "Years" } },
    { value: "20+", label: { zh: "交付项目", en: "Projects" } },
    { value: "10+", label: { zh: "技术栈", en: "Technologies" } },
    { value: "∞", label: { zh: "好奇心", en: "Curiosity" } },
  ],

  skills: [
    { name: { zh: "语言", en: "Languages" }, items: ["TypeScript", "Python", "Go", "Rust", "SQL"] },
    { name: { zh: "前端", en: "Frontend" }, items: ["React", "Next.js", "Tailwind", "Three.js", "GSAP"] },
    { name: { zh: "后端 & 数据", en: "Backend & Data" }, items: ["Node.js", "PostgreSQL", "Redis", "gRPC", "Kafka"] },
    { name: { zh: "基础设施", en: "Infrastructure" }, items: ["Docker", "Kubernetes", "AWS", "Vercel", "CI/CD"] },
  ],

  experience: [
    {
      period: { zh: "2024 — 至今", en: "2024 — Now" },
      company: { zh: "某科技公司", en: "A Tech Company" },
      role: { zh: "高级工程师", en: "Senior Engineer" },
      location: { zh: "远程", en: "Remote" },
      summary: {
        zh: "负责核心平台的架构与演进,带领小团队交付关键能力。",
        en: "Owned the architecture and evolution of the core platform; led a small team to ship key capabilities.",
      },
      highlights: [
        { zh: "重构核心服务,P99 延迟下降 40%,成本降低 25%。", en: "Re-architected core services — cut P99 latency 40% and cost 25%." },
        { zh: "建立可观测性与发布流程,事故恢复时间缩短一半。", en: "Built observability + release pipeline, halving incident recovery time." },
        { zh: "指导初级工程师,沉淀团队工程规范与文档。", en: "Mentored junior engineers; codified team engineering standards." },
      ],
    },
    {
      period: { zh: "2021 — 2024", en: "2021 — 2024" },
      company: { zh: "某创业公司", en: "A Startup" },
      role: { zh: "全栈工程师", en: "Full-stack Engineer" },
      location: { zh: "上海", en: "Shanghai" },
      summary: {
        zh: "从 0 到 1 搭建产品,横跨前端、后端与基础设施。",
        en: "Took the product from zero to one across frontend, backend, and infra.",
      },
      highlights: [
        { zh: "独立交付首个可用版本,支撑前 10k 用户增长。", en: "Shipped the first usable release, supporting growth to 10k users." },
        { zh: "设计数据模型与 API,奠定后续两年的扩展基础。", en: "Designed the data model + API that scaled for the next two years." },
      ],
    },
    {
      period: { zh: "2019 — 2021", en: "2019 — 2021" },
      company: { zh: "某互联网公司", en: "An Internet Company" },
      role: { zh: "软件工程师", en: "Software Engineer" },
      location: { zh: "北京", en: "Beijing" },
      summary: {
        zh: "参与大型系统的功能开发与性能优化。",
        en: "Contributed features and performance work on a large-scale system.",
      },
      highlights: [
        { zh: "优化关键路径,吞吐量提升 3×。", en: "Optimized the critical path for a 3× throughput gain." },
      ],
    },
  ],

  projects: [
    {
      name: { zh: "项目一", en: "Project One" },
      description: {
        zh: "一句话描述这个项目解决了什么问题、为谁而做。",
        en: "A one-line description of what this project solves and for whom.",
      },
      stack: ["Next.js", "PostgreSQL", "TypeScript"],
      href: "https://example.com",
      year: "2025",
    },
    {
      name: { zh: "项目二", en: "Project Two" },
      description: {
        zh: "突出技术难点或你独特的贡献。",
        en: "Highlight the hard part or your unique contribution.",
      },
      stack: ["Go", "Kubernetes", "gRPC"],
      href: "https://example.com",
      year: "2024",
    },
    {
      name: { zh: "项目三", en: "Project Three" },
      description: {
        zh: "可附上线上地址或源码链接。",
        en: "Link to a live demo or the source.",
      },
      stack: ["React", "Three.js", "GSAP"],
      href: "https://example.com",
      year: "2023",
    },
  ],

  education: [
    {
      period: { zh: "2015 — 2019", en: "2015 — 2019" },
      school: { zh: "某某大学", en: "Your University" },
      degree: { zh: "计算机科学与技术 · 学士", en: "B.Sc. in Computer Science" },
      detail: { zh: "可补充荣誉、GPA 或代表性课程。", en: "Add honors, GPA, or notable coursework." },
    },
  ],

  contacts: [
    { type: "email", value: "you@example.com", href: "mailto:you@example.com" },
    { type: "github", value: "github.com/yourname", href: "https://github.com/yourname" },
    { type: "website", value: "hypervoid.top", href: "https://hypervoid.top" },
    { type: "location", value: "China · Remote" },
  ],
};
