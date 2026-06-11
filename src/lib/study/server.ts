import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * URL prefix for in-app links. Empty on the tools subdomain (clean URLs like
 * /flashcards) and "/tools" everywhere else (main-domain path + Vercel preview
 * deployments, where the subdomain doesn't exist).
 */
export async function getToolsBase(): Promise<string> {
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase() ?? "";
  const onSubdomain = host === "study.hypervoid.top" || host === "study.localhost";
  return onSubdomain ? "" : "/tools";
}

/**
 * Server-side auth backstop for every /tools page. The proxy already gates the
 * subdomain, but /tools/* reachable via the main domain or a preview URL would
 * otherwise be ungated — so the layout enforces admin here too.
 */
export async function requireToolsAdmin() {
  const session = await auth();
  const user = session?.user as { isAdmin?: boolean } | undefined;
  if (!user?.isAdmin) redirect("/sign-in");
  return session;
}
