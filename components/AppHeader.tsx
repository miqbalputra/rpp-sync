"use client";
// AppHeader TailAdmin: sticky top, hamburger toggle (collapse desktop / drawer mobile),
// notification bell, theme toggle, dan user dropdown (Edit Profil / Pengaturan / Bantuan / Keluar).
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, Sun, Moon, LogOut, ChevronDown, UserCog, Settings, LifeBuoy,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/context/ThemeContext";
import { logoutAction } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./NotificationBell";
import type { ShellVariant } from "./Sidebar";
import type { NotifData } from "@/lib/notifikasi/queries";

const PANEL_LABEL: Record<ShellVariant, string> = {
  admin: "Admin Panel",
  guru: "Portal Guru",
  kepala: "Kepala Sekolah",
  pj: "PJ Diniyyah",
};

const ROOT_SEGMENTS = new Set(["admin", "guru", "kepala", "pj"]);

export function AppHeader({
  variant,
  user,
  notifications,
}: {
  variant: ShellVariant;
  user?: { id?: string | null; name?: string | null; email?: string | null; role?: string | null } | null;
  notifications?: NotifData;
}) {
  const { toggleSidebar, toggleMobileSidebar, isMobile } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const pageTitle = (() => {
    const seg = pathname.split("/").filter(Boolean);
    const last = seg[seg.length - 1];
    if (!last || ROOT_SEGMENTS.has(last)) return "Dashboard";
    return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ");
  })();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/90 px-4 backdrop-blur-md sm:px-6 dark:border-gray-800 dark:bg-gray-900/90">
      <button
        type="button"
        onClick={isMobile ? toggleMobileSidebar : toggleSidebar}
        aria-label="Toggle sidebar"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="hidden text-lg font-semibold text-gray-800 sm:block dark:text-white/90">
        {pageTitle}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell
          items={notifications?.items ?? []}
          unreadCount={notifications?.unreadCount ?? 0}
          overdue={notifications?.overdue ?? []}
          userRole={user?.role ?? ""}
          userId={user?.id ?? ""}
        />

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-gray-100 dark:hover:bg-white/5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
                {(user?.name ?? user?.email ?? "?").charAt(0).toUpperCase()}
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">
                  {user?.name ?? "—"}
                </span>
                <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                  {PANEL_LABEL[variant]}
                </span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <div className="font-medium text-gray-800 dark:text-white/90">{user?.name ?? "—"}</div>
              <div className="truncate text-xs font-normal text-gray-500 dark:text-gray-400">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/akun/profil">
                <UserCog className="h-4 w-4" /> Edit Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/akun/pengaturan">
                <Settings className="h-4 w-4" /> Pengaturan Akun
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/akun/bantuan">
                <LifeBuoy className="h-4 w-4" /> Bantuan
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logoutAction} className="w-full">
              <button
                type="submit"
                className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
              >
                <LogOut className="h-4 w-4" /> Keluar
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}