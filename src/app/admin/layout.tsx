import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

/**
 * Shared admin layout. Provides a sidebar on desktop and a
 * slide-out drawer on mobile. Individual pages still handle
 * their own auth checks.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <AdminSidebar />
      {/* Main content: offset for desktop sidebar */}
      <div className="lg:pl-56">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
