import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Resend from "next-auth/providers/resend";
import { HypervoidAuthAdapter } from "@/auth-adapter";
import { getSiteSetting } from "@/db/site-settings";

const ADMIN_GITHUB_LOGIN =
  process.env.ADMIN_GITHUB_LOGIN?.trim() || "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;

function isAuthEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function isAdminIdentity(user: { login?: string | null; email?: string | null } | undefined): boolean {
  const email = user?.email?.trim().toLowerCase();
  return user?.login === ADMIN_GITHUB_LOGIN || Boolean(ADMIN_EMAIL && email === ADMIN_EMAIL);
}

function authEmailFrom(): string {
  const email = process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
  const name = process.env.RESEND_FROM_NAME?.trim() || "Hypervoid";
  return `${name} <${email}>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendHypervoidVerificationRequest({
  identifier,
  url,
  provider,
}: {
  identifier: string;
  url: string;
  provider: { apiKey?: string; from?: string };
}) {
  if (!provider.apiKey) throw new Error("RESEND_API_KEY is not set");

  const { host } = new URL(url);
  const safeUrl = escapeHtml(url);
  const safeHost = escapeHtml(host);
  const safeTo = escapeHtml(identifier);

  const html = `<!doctype html>
<html lang="zh-CN">
  <body style="margin:0;background:#09090b;padding:32px;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f4f4f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;border-collapse:collapse;">
      <tr>
        <td style="border:1px solid rgba(255,255,255,.12);background:#111113;padding:32px;">
          <p style="margin:0 0 16px;color:#a1a1aa;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">Hypervoid</p>
          <h1 style="margin:0;color:#fafafa;font-size:28px;line-height:1.2;font-weight:700;">登录你的博客空间</h1>
          <p style="margin:16px 0 28px;color:#d4d4d8;font-size:15px;line-height:1.7;">点击下方按钮完成邮箱登录。这个链接 15 分钟内有效，只能使用一次。</p>
          <a href="${safeUrl}" style="display:inline-block;background:#fafafa;color:#09090b;text-decoration:none;padding:13px 18px;font-size:14px;font-weight:700;">登录 Hypervoid</a>
          <p style="margin:28px 0 0;color:#a1a1aa;font-size:13px;line-height:1.7;">如果按钮打不开，请复制此链接到浏览器：<br><span style="color:#e4e4e7;word-break:break-all;">${safeUrl}</span></p>
          <p style="margin:24px 0 0;color:#71717a;font-size:12px;line-height:1.6;">请求邮箱：${safeTo}<br>来源站点：${safeHost}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `登录 Hypervoid\n\n打开这个链接完成登录：${url}\n\n链接 15 分钟内有效，只能使用一次。\n请求邮箱：${identifier}\n来源站点：${host}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: provider.from ?? authEmailFrom(),
      to: identifier,
      subject: `登录 ${host}`,
      html,
      text,
    }),
  });

  if (!res.ok) {
    throw new Error("Resend error: " + JSON.stringify(await res.json()));
  }
}

const emailProviders = isAuthEmailConfigured()
  ? [
      Resend({
        id: "email",
        name: "Email",
        apiKey: process.env.RESEND_API_KEY,
        from: authEmailFrom(),
        maxAge: 15 * 60,
        sendVerificationRequest: sendHypervoidVerificationRequest,
      }),
    ]
  : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: isAuthEmailConfigured() ? HypervoidAuthAdapter() : undefined,
  session: { strategy: "jwt" },
  providers: [GitHub, ...emailProviders],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        if (token?.login) {
          (session.user as { login?: string }).login = token.login as string;
        }
        if (token?.email) {
          session.user.email = token.email as string;
        }
        (session.user as { isAdmin?: boolean }).isAdmin = isAdminIdentity({
          login: token?.login as string | undefined,
          email: token?.email as string | undefined,
        });
      }
      return session;
    },
    async jwt({ token, profile, user }) {
      const login = (profile as { login?: string } | undefined)?.login;
      if (login) token.login = login;
      if (user?.email) token.email = user.email;
      return token;
    },
    async authorized({ auth, request }) {
      const { pathname } = request.nextUrl;

      // Admin routes always require admin login
      if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
        return isAdminIdentity(auth?.user as { login?: string | null; email?: string | null } | undefined);
      }

      // Public routes that never require login
      const publicRoutes = ["/sign-in", "/api/auth", "/api/webmention"];
      if (publicRoutes.some((r) => pathname.startsWith(r))) return true;

      // Check login policy from DB
      try {
        const policy = (await getSiteSetting("site_login_required")) || "optional";

        if (policy === "required") {
          // All pages require login
          return !!auth?.user;
        }

        if (policy === "private_only") {
          // Only /private routes require login
          if (pathname.startsWith("/private")) {
            return !!auth?.user;
          }
          return true;
        }

        // "optional" — no login required
        return true;
      } catch {
        // DB error — fail closed (deny access)
        return false;
      }
    },
  },
  events: {
    // Fires after a successful GitHub sign-in. Records the account so the
    // admin dashboard can list everyone who has ever logged into the blog.
    async signIn({ user, profile }) {
      const login = (profile as { login?: string } | undefined)?.login;
      if (!login) return;
      try {
        const { recordVisitorLogin } = await import("@/db/visitor-logins");
        await recordVisitorLogin({
          githubLogin: login,
          githubName: user.name ?? null,
          avatarUrl: user.image ?? null,
        });
      } catch (e) {
        console.warn("[auth] visitor-login record failed:", e);
      }
    },
  },
});

export const ADMIN_LOGIN = ADMIN_GITHUB_LOGIN;

/**
 * Defense-in-depth gate for server actions and route handlers. Middleware
 * already blocks unauthorized requests to /admin/* and /api/admin/*, but
 * server actions can be invoked from any page in the app, so each one
 * must verify isAdmin itself. Throws — callers don't need to handle.
 */
export async function requireAdmin(): Promise<void> {
  const session = await auth();
  const user = session?.user as
    | { isAdmin?: boolean; login?: string; email?: string }
    | undefined;
  if (!user?.isAdmin && !isAdminIdentity(user)) {
    throw new Error("Not authorized");
  }
}
