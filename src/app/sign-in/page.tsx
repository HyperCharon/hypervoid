import type { Metadata } from "next";
import { auth } from "@/auth";
import { isEmailConfigured } from "@/lib/email";
import { VoidEntryLogin } from "@/components/VoidEntryLogin";

export const metadata: Metadata = {
  title: "登录 · Hypervoid",
  robots: { index: false, follow: false },
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function safeInternalPath(value: string | string[] | undefined, fallback: string): string {
  const path = firstValue(value);
  if (!path) return fallback;
  // Same-origin relative path (but not protocol-relative "//evil.com").
  if (path.startsWith("/") && !path.startsWith("//")) return path;
  // Absolute URL is allowed only when it targets this site's own registrable
  // domain (e.g. the study/cv subdomains), never an attacker host. This lets
  // post-login return the visitor to the subdomain they came from.
  try {
    const target = new URL(path);
    if (
      target.protocol === "https:" &&
      (target.hostname === "hypervoid.top" ||
        target.hostname.endsWith(".hypervoid.top"))
    ) {
      return target.toString();
    }
  } catch {
    // not a valid absolute URL → fall through
  }
  return fallback;
}

export default async function SignInPage(props: {
  searchParams: Promise<{ callbackUrl?: string | string[]; error?: string | string[] }>;
}) {
  const session = await auth();
  const { callbackUrl, error } = await props.searchParams;
  const redirectTo = safeInternalPath(callbackUrl, "/");
  const user = session?.user as
    | {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        login?: string | null;
        isAdmin?: boolean | null;
      }
    | undefined;

  return (
    <VoidEntryLogin
      redirectTo={redirectTo}
      error={firstValue(error)}
      emailEnabled={isEmailConfigured()}
      currentUser={
        user
          ? {
              name: user.name ?? null,
              email: user.email ?? null,
              image: user.image ?? null,
              login: user.login ?? null,
              isAdmin: user.isAdmin === true,
            }
          : null
      }
    />
  );
}
