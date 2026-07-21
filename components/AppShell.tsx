"use client";
// AppShell: orkestrasi client untuk layout TailAdmin.
// Mengatur margin-left konten utama (290/90px) berdasarkan state sidebar desktop,
// serta backdrop drawer pada mobile.
import { useSidebar } from "@/context/SidebarContext";
import { Sidebar, type ShellVariant } from "./Sidebar";
import { AppHeader } from "./AppHeader";
import type { NotifData } from "@/lib/notifikasi/queries";

export function AppShell({
  variant,
  user,
  notifications,
  children,
}: {
  variant: ShellVariant;
  user?: { id?: string | null; name?: string | null; email?: string | null; role?: string | null } | null;
  notifications?: NotifData;
  children: React.ReactNode;
}) {
  const { isExpanded, isMobile, isMobileOpen, setIsMobileOpen } = useSidebar();

  // Margin konten hanya berlaku pada desktop. Mobile = 0 (sidebar off-canvas).
  const marginLeft = isMobile ? 0 : isExpanded ? 290 : 90;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-dark">
      <Sidebar variant={variant} />
      {isMobile && isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm"
        />
      )}
      <div
        className="flex min-h-screen flex-col transition-all duration-300"
        style={{ marginLeft }}
      >
        <AppHeader variant={variant} user={user} notifications={notifications} />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}