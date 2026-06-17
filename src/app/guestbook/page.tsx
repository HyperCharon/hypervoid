import type { Metadata } from "next";
import Image from "next/image";
import { auth, ADMIN_LOGIN } from "@/auth";
import { listVisibleMessages } from "@/db/guestbook";
import { GuestbookForm } from "@/components/GuestbookForm";
import { GuestbookAdminControls } from "@/components/GuestbookAdminControls";
import { formatDateTimeCN } from "@/lib/datetime";
import { renderMentionsHtml } from "@/lib/mentions";
import { getMessages } from "@/lib/i18n-server";
import {
  signInForGuestbook,
  signOutFromGuestbook,
} from "@/app/guestbook/actions";
import { SignOutButton } from "@/components/SignOutButton";

export const metadata: Metadata = {
  title: "留言板",
  description: "留下你的足迹",
};

export const revalidate = 60;

const formatDate = formatDateTimeCN;

export default async function GuestbookPage() {
  const [session, messages, t] = await Promise.all([auth(), listVisibleMessages(), getMessages()]);
  const currentLogin =
    (session?.user as { login?: string } | undefined)?.login ?? null;
  const isAdmin = currentLogin === ADMIN_LOGIN;

  return (
    <div className="mx-auto flex flex-col gap-6">
      <header className="hv-panel relative overflow-hidden p-5 sm:p-7">
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <div aria-hidden className="absolute left-0 top-0 h-8 w-8 border-l border-t border-accent/40" />
        <div aria-hidden className="absolute right-0 top-0 h-2 w-2 rounded-full bg-accent animate-pulse" />
        <p className="hv-kicker">{t.guestbook.kicker}</p>
        <h1 className="hv-title mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
          {t.nav.guestbook}
        </h1>
        <p className="mt-3 text-sm text-muted">
          {t.guestbook.description}
        </p>
      </header>

      <section className="hv-panel p-5">
        {session?.user ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted">
                {t.guestbook.loggedIn}
                <span className="font-mono font-medium text-foreground">@{currentLogin ?? "?"}</span>
              </span>
              <SignOutButton className="text-xs text-muted-soft hover:text-foreground transition">
                {t.guestbook.signOut}
              </SignOutButton>
            </div>
            <GuestbookForm />
          </div>
        ) : (
          <form
            action={signInForGuestbook}
            className="flex flex-col items-start gap-3"
          >
            <p className="text-sm text-muted">{t.guestbook.loginPrompt}</p>
            <button
              type="submit"
              className="dark-locked inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#24292f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f2329]"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              {t.guestbook.loginGithub}
            </button>
          </form>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="hv-chip">{messages.length} {t.guestbook.messagesCount}</span>
        </div>
        {messages.length === 0 ? (
          <p className="hv-panel border-dashed p-8 text-center text-muted">
            {t.guestbook.empty}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((m) => (
              <li
                key={m.id}
                className="hv-card p-4 transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  {m.avatarUrl ? (
                    <Image
                      src={m.avatarUrl}
                      alt=""
                      width={80}
                      height={80}
                      sizes="40px"
                      loading="lazy"
                      className="h-10 w-10 shrink-0 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-accent/10 font-medium text-foreground">
                      {(m.githubName || m.githubLogin).slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <a
                        href={`https://github.com/${m.githubLogin}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="min-w-0 truncate text-sm font-medium text-foreground hover:text-foreground transition"
                      >
                        {m.githubName || m.githubLogin}
                        <span className="ml-1 font-mono text-xs font-normal text-muted">
                          @{m.githubLogin}
                        </span>
                      </a>
                      <time className="shrink-0 font-mono text-xs text-muted-soft">
                        {formatDate(m.createdAt)}
                      </time>
                    </div>
                    <p
                      className="mt-2 whitespace-pre-wrap break-words text-sm text-muted"
                      dangerouslySetInnerHTML={{
                        __html: renderMentionsHtml(
                          m.message.replace(/\r\n/g, "\n").replace(/\r/g, "\n"),
                        ),
                      }}
                    />
                    {isAdmin ? (
                      <div className="mt-2">
                        <GuestbookAdminControls id={m.id} />
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
