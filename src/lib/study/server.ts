import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, requireAdmin } from "@/auth";

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
 * subdomain and the /tools tree, but the layout enforces admin here too as
 * defence in depth. Delegates to the canonical requireAdmin so the check can't
 * drift; redirects (rather than throwing) since this fronts a page render.
 */
export async function requireToolsAdmin() {
  try {
    await requireAdmin();
  } catch {
    redirect("/sign-in");
  }
  return auth();
}
