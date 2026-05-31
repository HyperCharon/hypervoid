"use client";

import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CircleDot,
  Loader2,
  LogOut,
  Mail,
  Orbit,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { type FormEvent, type PointerEvent, useEffect, useId, useState } from "react";
import { signIn, signOut } from "@/auth.client";

type EntryState = "explore" | "login";
type AuthLoading = "github" | "email" | "signout" | null;

type CurrentUser = {
  name: string | null;
  email: string | null;
  image: string | null;
  login: string | null;
  isAdmin: boolean;
};

type VoidEntryLoginProps = {
  emailEnabled: boolean;
  currentUser: CurrentUser | null;
  redirectTo?: string;
  error?: string;
};

const statusRows = [
  ["GitHub", "主登录"],
  ["邮箱中继", "备用"],
  ["Session", "JWT"],
  ["Access", "Protected"],
] as const;

const errorCopy: Record<string, string> = {
  AccessDenied: "登录被拒绝，请换一种方式重试。",
  Configuration: "登录服务配置不完整，请稍后再试。",
  Verification: "邮箱链接无效或已过期，请重新发送。",
  OAuthSignin: "GitHub 登录暂时不可用，请稍后重试。",
  OAuthCallback: "GitHub 回调失败，请重新登录。",
};

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.86 8.37 6.84 9.73.5.09.68-.22.68-.49v-1.9c-2.78.62-3.37-1.22-3.37-1.22-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.86.09-.66.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.04 1.03-2.75-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05A9.34 9.34 0 0 1 12 6.94c.85 0 1.7.12 2.5.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.71 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9v2.81c0 .27.18.59.69.49A10.14 10.14 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z"
      />
    </svg>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readableError(error: string | undefined): string | null {
  if (!error) return null;
  return errorCopy[error] ?? "登录失败：" + error;
}

export function VoidEntryLogin({ emailEnabled, currentUser, redirectTo = "/", error }: VoidEntryLoginProps) {
  const [entryState, setEntryState] = useState<EntryState>("explore");
  const [parallaxEnabled, setParallaxEnabled] = useState(false);
  const [loading, setLoading] = useState<AuthLoading>(null);
  const [emailValue, setEmailValue] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const emailId = useId();
  const reducedMotion = useReducedMotion();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 90, damping: 28, mass: 0.4 });
  const smoothY = useSpring(pointerY, { stiffness: 90, damping: 28, mass: 0.4 });

  const videoX = useTransform(smoothX, [-1, 1], [10, -10]);
  const videoY = useTransform(smoothY, [-1, 1], [8, -8]);
  const hudX = useTransform(smoothX, [-1, 1], [-18, 18]);
  const hudY = useTransform(smoothY, [-1, 1], [-12, 12]);
  const textX = useTransform(smoothX, [-1, 1], [-32, 32]);
  const textY = useTransform(smoothY, [-1, 1], [-20, 20]);
  const panelX = useTransform(smoothX, [-1, 1], [-14, 14]);
  const panelY = useTransform(smoothY, [-1, 1], [-10, 10]);
  const rotateX = useTransform(smoothY, [-1, 1], [2.5, -2.5]);
  const rotateY = useTransform(smoothX, [-1, 1], [-3.5, 3.5]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const query = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 769px)");
    const update = () => setParallaxEnabled(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (!parallaxEnabled || reducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1);
    pointerY.set(((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
  }

  function resetPointer() {
    pointerX.set(0);
    pointerY.set(0);
  }

  const currentIdentity = currentUser?.login
    ? "@" + currentUser.login
    : currentUser?.name || currentUser?.email || "已登录用户";
  const visibleError = authError ?? readableError(error);
  const primaryHref = currentUser && redirectTo !== "/" ? redirectTo : "/posts";
  const primaryLabel = currentUser && redirectTo !== "/" ? "继续访问" : "进入博客";

  async function handleSignOut() {
    setAuthError(null);
    setLoading("signout");
    try {
      await signOut({ redirectTo: "/" });
    } catch {
      setAuthError("退出登录失败，请刷新后重试。");
      setLoading(null);
    }
  }

  async function handleGitHub() {
    setAuthError(null);
    setEmailSent(false);
    setLoading("github");
    try {
      await signIn("github", { redirectTo });
    } catch {
      setAuthError("GitHub 登录没有启动，请检查网络后重试。");
      setLoading(null);
    }
  }

  async function handleEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);

    const email = emailValue.trim();
    if (!emailEnabled) {
      setAuthError("邮箱登录尚未启用，需要配置 RESEND_API_KEY。");
      return;
    }
    if (!isValidEmail(email)) {
      setAuthError("请输入有效的邮箱地址。");
      return;
    }

    setLoading("email");
    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        redirectTo,
      });

      if (result?.error) {
        setAuthError("邮箱登录链接发送失败，请优先使用 GitHub，或稍后重试。");
        return;
      }

      setEmailValue(email);
      setEmailSent(true);
    } catch {
      setAuthError("邮箱登录链接发送失败，请稍后重试。");
    } finally {
      setLoading(null);
    }
  }

  const ringSpin = reducedMotion ? undefined : { rotate: 360 };

  return (
    <section
      className="dark-locked fixed inset-0 z-[60] min-h-dvh overflow-hidden bg-black text-white"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 scale-[1.04] transform-gpu will-change-transform"
        style={{ x: parallaxEnabled && !reducedMotion ? videoX : 0, y: parallaxEnabled && !reducedMotion ? videoY : 0 }}
        animate={{ scale: entryState === "login" ? 1.08 : 1.04 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <video
          className="hypervoid-entry-video absolute object-cover object-center"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="/1.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </motion.div>

      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(0,229,255,0.08),rgba(0,0,0,0.12)_34%,rgba(0,0,0,0.82)_100%)]" />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.82),transparent_28%,transparent_70%,rgba(0,0,0,0.8))]" />
      <div aria-hidden className="hypervoid-entry-grid absolute inset-0 opacity-35" />
      <div aria-hidden className="hypervoid-entry-scanlines absolute inset-0 opacity-[0.12]" />
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-black/20 supports-[backdrop-filter]:bg-black/10"
        animate={{
          backdropFilter: entryState === "login" ? "blur(25px)" : "blur(0px)",
          backgroundColor: entryState === "login" ? "rgba(0,0,0,0.48)" : "rgba(0,0,0,0.08)",
        }}
        transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{ x: parallaxEnabled && !reducedMotion ? hudX : 0, y: parallaxEnabled && !reducedMotion ? hudY : 0 }}
      >
        <div className="absolute left-5 top-5 h-16 w-16 border-l border-t border-emerald-200/40 md:left-8 md:top-8" />
        <div className="absolute right-5 top-5 h-16 w-16 border-r border-t border-emerald-200/40 md:right-8 md:top-8" />
        <div className="absolute bottom-5 left-5 h-16 w-16 border-b border-l border-emerald-200/40 md:bottom-8 md:left-8" />
        <div className="absolute bottom-5 right-5 h-16 w-16 border-b border-r border-emerald-200/40 md:bottom-8 md:right-8" />
        <div className="absolute left-[8%] top-[20%] hidden h-px w-24 bg-emerald-200/35 md:block" />
        <div className="absolute right-[10%] top-[28%] hidden h-px w-28 bg-emerald-200/30 md:block" />
        <div className="absolute bottom-[23%] left-[12%] hidden h-px w-20 bg-emerald-200/25 md:block" />
        <div className="absolute left-[18%] top-[36%] h-3 w-3 border border-emerald-100/50" />
        <div className="absolute right-[22%] top-[18%] h-3 w-3 border border-emerald-100/50" />
        <div className="absolute bottom-[31%] right-[18%] h-3 w-3 border border-emerald-100/50" />
      </motion.div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[min(72vw,680px)] w-[min(72vw,680px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-100/20 shadow-[0_0_70px_rgba(167,139,250,0.12)]"
        animate={ringSpin}
        transition={{ repeat: Infinity, duration: 54, ease: "linear" }}
      >
        <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-emerald-100 shadow-[0_0_18px_rgba(196,181,253,0.9)]" />
      </motion.div>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[min(54vw,500px)] w-[min(54vw,500px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/20"
        animate={reducedMotion ? undefined : { rotate: -360 }}
        transition={{ repeat: Infinity, duration: 38, ease: "linear" }}
      />

      <main className="relative z-20 grid min-h-dvh place-items-center overflow-y-auto px-4 py-8 [perspective:1200px] sm:px-6">
        <AnimatePresence mode="wait">
          {entryState === "explore" ? (
            <motion.div
              key="explore"
              className="grid w-full place-items-center text-center"
              style={{ x: parallaxEnabled && !reducedMotion ? textX : 0, y: parallaxEnabled && !reducedMotion ? textY : 0 }}
              initial={{ opacity: 0, scale: 0.96, filter: "blur(14px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.22, filter: "blur(18px)" }}
              transition={{ duration: 0.46, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="hypervoid-glow-pulse mb-7 inline-flex items-center gap-3 border border-emerald-100/25 bg-white/[0.045] px-4 py-2 font-mono text-[11px] uppercase text-emerald-50/85 shadow-[0_0_28px_rgba(34,211,238,0.12)] backdrop-blur-md">
                <CircleDot className="h-3.5 w-3.5 text-emerald-200" aria-hidden />
                {currentUser ? "SIGNED IN / " + currentIdentity : "HV-001 / VOID ACCESS"}
              </div>

              <h1 className="hypervoid-glow-pulse max-w-full text-[clamp(3.1rem,14vw,10rem)] font-black uppercase leading-[0.82] text-white drop-shadow-[0_0_46px_rgba(125,211,252,0.36)]">
                Hypervoid
              </h1>
              <p className="mt-7 max-w-[34rem] font-mono text-xs uppercase leading-6 text-emerald-50/72 sm:text-sm">
                {currentUser ? "Identity confirmed. Session channel is active." : "GitHub primary access online. Email magic link remains on standby."}
              </p>

              <button
                type="button"
                onClick={() => setEntryState("login")}
                className="group mt-10 inline-flex min-h-12 cursor-pointer items-center gap-3 border border-emerald-100/35 bg-emerald-50 px-6 py-3 text-sm font-black uppercase text-black shadow-[0_0_46px_rgba(167,139,250,0.28)] transition duration-300 hover:border-white hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100/80 active:scale-[0.97]"
              >
                Explore
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="login"
              className="grid w-full max-w-5xl grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,440px)_280px]"
              style={{
                x: parallaxEnabled && !reducedMotion ? panelX : 0,
                y: parallaxEnabled && !reducedMotion ? panelY : 0,
                rotateX: parallaxEnabled && !reducedMotion ? rotateX : 0,
                rotateY: parallaxEnabled && !reducedMotion ? rotateY : 0,
                transformPerspective: 1200,
              }}
              initial={{ opacity: 0, y: 42, scale: 0.92, filter: "blur(18px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -28, scale: 0.96, filter: "blur(14px)" }}
              transition={{ type: "spring", stiffness: 120, damping: 20, mass: 0.8 }}
            >
              <section className="hypervoid-glass transform-gpu border border-white/20 bg-white/10 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_0_60px_rgba(34,211,238,0.18)] backdrop-blur-xl sm:p-7">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[11px] uppercase text-emerald-100/70">Secure Gateway / 身份入口</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-normal text-white">登录 Hypervoid</h2>
                    <p className="mt-2 text-sm leading-6 text-white/58">GitHub 为主要登录方式，邮箱 magic link 作为备用入口。</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEntryState("explore")}
                    aria-label="Back to explore"
                    title="Back to explore"
                    className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border border-white/15 bg-white/10 text-white/80 transition hover:border-emerald-100/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100/80"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                  </button>
                </div>

                <div aria-live="polite" className="min-h-0">
                  {visibleError ? (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      role="alert"
                      className="mb-5 flex items-start gap-3 border border-red-200/35 bg-red-500/12 px-4 py-3 text-sm leading-6 text-red-50"
                    >
                      <AlertCircle className="mt-1 h-4 w-4 shrink-0" aria-hidden />
                      <span>{visibleError}</span>
                    </motion.div>
                  ) : null}
                </div>

                {currentUser ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-emerald-100/35 bg-emerald-50/10 p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="grid h-12 w-12 shrink-0 place-items-center border border-emerald-100/50 bg-black/35 bg-cover bg-center text-sm font-black text-emerald-100"
                        style={currentUser.image ? { backgroundImage: "url(" + currentUser.image + ")" } : undefined}
                        aria-hidden
                      >
                        {currentUser.image ? null : currentIdentity.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs uppercase text-emerald-50">GitHub 已连接</p>
                        <p className="mt-2 break-all text-sm leading-6 text-white/70">
                          当前身份 <span className="font-semibold text-white">{currentIdentity}</span>，会话已生效。
                        </p>
                        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                          <Link
                            href={primaryHref}
                            className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 whitespace-nowrap border border-emerald-100/55 bg-emerald-50 px-4 text-sm font-black uppercase text-black transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100/80"
                          >
                            {primaryLabel}
                            <ArrowRight className="h-4 w-4" aria-hidden />
                          </Link>
                          {currentUser.isAdmin ? (
                            <Link
                              href="/admin"
                              className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 whitespace-nowrap border border-white/20 bg-white/10 px-4 text-sm font-black uppercase text-white transition hover:border-emerald-100/60 hover:bg-emerald-50/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100/70"
                            >
                              进入后台
                            </Link>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          disabled={loading !== null}
                          className="mt-4 inline-flex min-h-10 cursor-pointer items-center gap-2 px-0 text-sm font-bold uppercase text-emerald-100 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100/60 disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          {loading === "signout" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LogOut className="h-4 w-4" aria-hidden />}
                          退出登录
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : emailSent ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-emerald-100/35 bg-emerald-50/10 p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="grid h-11 w-11 shrink-0 place-items-center border border-emerald-100/50 text-emerald-100">
                        <CheckCircle2 className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <p className="font-mono text-xs uppercase text-emerald-50">登录链接已发送</p>
                        <p className="mt-2 text-sm leading-6 text-white/70">
                          请查看 <span className="font-semibold text-white">{emailValue}</span>，链接将在 15 分钟后失效。
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setEmailSent(false);
                            setEmailValue("");
                            setAuthError(null);
                          }}
                          className="mt-4 min-h-11 cursor-pointer px-0 text-sm font-bold uppercase text-emerald-100 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100/60"
                        >
                          更换邮箱
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleGitHub}
                      disabled={loading !== null}
                      className="group flex min-h-14 w-full cursor-pointer items-center justify-center gap-3 border border-white/70 bg-white px-5 text-sm font-black uppercase text-black shadow-[0_0_40px_rgba(255,255,255,0.16)] transition duration-200 hover:border-emerald-100 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100/80 disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {loading === "github" ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <GitHubMark className="h-4 w-4" />
                      )}
                      <span>使用 GitHub 登录</span>
                      <span className="ml-auto hidden border border-black/20 px-2 py-1 text-xs font-black sm:inline-flex">
                        推荐
                      </span>
                    </button>

                    <div className="my-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="h-px bg-white/18" />
                      <span className="font-mono text-xs uppercase text-white/45">邮箱备用登录</span>
                      <div className="h-px bg-white/18" />
                    </div>

                    <form className="space-y-3" onSubmit={handleEmail} noValidate>
                      <label htmlFor={emailId} className="flex items-center gap-2 font-mono text-xs uppercase text-emerald-50/72">
                        <Mail className="h-3.5 w-3.5" aria-hidden />
                        邮箱地址
                      </label>
                      <div className="relative">
                        <input
                          id={emailId}
                          name="email"
                          type="email"
                          autoComplete="email"
                          inputMode="email"
                          value={emailValue}
                          onChange={(event) => {
                            setEmailValue(event.target.value);
                            setAuthError(null);
                          }}
                          aria-describedby={`${emailId}-hint`}
                          disabled={loading !== null || !emailEnabled}
                          className="h-12 w-full border border-white/15 bg-black/40 px-4 pr-12 text-base text-white outline-none transition placeholder:text-white/35 focus:border-emerald-100/70 focus:bg-black/50 focus:ring-2 focus:ring-emerald-100/20 disabled:cursor-not-allowed disabled:opacity-55"
                          placeholder="you@example.com"
                        />
                        {loading === "email" ? (
                          <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-100" aria-hidden />
                        ) : (
                          <Mail className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/38" aria-hidden />
                        )}
                      </div>
                      <p id={`${emailId}-hint`} className="text-xs leading-5 text-white/50">
                        {emailEnabled
                          ? "发送一次性登录链接，无需密码。"
                          : "邮箱登录未启用，需要配置 RESEND_API_KEY。"}
                      </p>
                      <button
                        type="submit"
                        disabled={loading !== null || !emailEnabled}
                        className="group inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-3 border border-white/20 bg-transparent px-5 py-3 text-sm font-black uppercase text-white transition hover:border-emerald-100/60 hover:bg-emerald-50/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100/70 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {loading === "email" ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <Mail className="h-4 w-4" aria-hidden />
                        )}
                        发送邮箱登录链接
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
                      </button>
                    </form>
                  </>
                )}

                <div className="mt-5 grid grid-cols-3 border-y border-white/12 py-3 font-mono text-xs uppercase text-white/50">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-100" aria-hidden />
                    GitHub 主登录
                  </span>
                  <span className="flex items-center justify-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-100" aria-hidden />
                    邮箱备用
                  </span>
                  <span className="flex items-center justify-end gap-1.5">
                    <BadgeCheck className="h-3.5 w-3.5 text-emerald-100" aria-hidden />
                    已验证
                  </span>
                </div>
              </section>

              <aside className="hypervoid-glass border border-white/20 bg-white/10 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_45px_rgba(14,165,233,0.12)] backdrop-blur-xl">
                <div className="mb-5 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center border border-emerald-100/30 bg-emerald-50/10 text-emerald-100">
                    <Orbit className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="font-mono text-[11px] uppercase text-emerald-100/70">System Status</p>
                    <p className="text-sm text-white">登录通道在线</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {statusRows.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between border-b border-white/10 pb-2 font-mono text-[11px] uppercase">
                      <span className="text-emerald-50/60">{label}</span>
                      <span className="inline-flex items-center gap-2 text-emerald-50">
                        <BadgeCheck className="h-3.5 w-3.5 text-emerald-200" aria-hidden />
                        {label === "GitHub" && currentUser ? "已连接" : label === "邮箱中继" ? (emailEnabled ? value : "未启用") : value}
                      </span>
                    </div>
                  ))}
                </div>
              </aside>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </section>
  );
}
