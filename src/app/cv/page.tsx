import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getCvData, isCvVisible } from "@/lib/cv-store";
import { CvPage } from "./CvPage";

export const metadata: Metadata = {
  title: "简历 · CV",
  description: "工程师个人简历 — Engineer résumé.",
  // Keep out of search indexes while content is placeholder. Flip to index when ready.
  robots: { index: false, follow: false },
};

export default async function Page() {
  const [visible, data] = await Promise.all([isCvVisible(), getCvData()]);

  // Hidden by default. Admins can still preview before publishing.
  if (!visible) {
    const session = await auth();
    const user = session?.user as { isAdmin?: boolean } | undefined;
    if (!user?.isAdmin) notFound();
  }

  return <CvPage data={data} />;
}
