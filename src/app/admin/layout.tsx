import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { viewportFit: "cover" };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-background text-foreground">
      <AdminSidebar />
      <div className="lg:pl-60">
        <main className="mx-auto max-w-5xl px-4 py-4 pb-20 sm:px-6 sm:py-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
