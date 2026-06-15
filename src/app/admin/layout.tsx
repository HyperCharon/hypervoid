import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { AdminTopNav } from "@/components/admin/AdminTopNav";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { viewportFit: "cover" };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background text-foreground">
      <AdminTopNav />
      <main className="mx-auto max-w-5xl px-4 py-4 pb-20 sm:px-6 sm:py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
