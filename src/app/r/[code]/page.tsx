import type { Metadata } from "next";
import { notFound, redirect as nextRedirect } from "next/navigation";
import { resolveAndHit } from "@/db/redirects";

export const metadata: Metadata = {
  robots: { index: false },
};

export const dynamic = "force-dynamic";

function isSafeRedirectTarget(url: string): boolean {
  // Relative paths are safe
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  // Only allow https:// URLs to prevent javascript: / data: / etc.
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default async function ShortLink(props: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await props.params;
  const target = await resolveAndHit(code).catch(() => null);
  if (!target || !isSafeRedirectTarget(target)) notFound();
  nextRedirect(target);
}
