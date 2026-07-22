"use client";
// Sidebar TailAdmin: desktop collapsible (290px / 90px, hover-expand), mobile off-canvas drawer.
// Nav + ikon didefinisikan di sini (client) agar ikon tidak melewati batas
// server→client sebagai prop (error serialisasi RSC).
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, BookOpen, School, Link2, Trash2,
  FileText, Search, CalendarClock, Sparkles, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/context/SidebarContext";

export type ShellVariant = "admin" | "guru" | "kepala" | "pj";

type NavEntry = { href: string; label: string; icon: LucideIcon };

const ROOTS = ["/admin", "/guru", "/kepala", "/pj"];

const NAVS: Record<ShellVariant, NavEntry[]> = {
  admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "User", icon: Users },
    { href: "/admin/mapel", label: "Mapel", icon: BookOpen },
    { href: "/admin/kelas", label: "Kelas", icon: School },
    { href: "/admin/penugasan", label: "Penugasan", icon: Link2 },
    { href: "/jadwal", label: "Jadwal", icon: CalendarClock },
    { href: "/admin/ai", label: "Pengaturan AI", icon: Sparkles },
    { href: "/admin/recycle-bin", label: "Sampah", icon: Trash2 },
  ],
  guru: [
    { href: "/guru", label: "Dashboard", icon: LayoutDashboard },
    { href: "/guru/rpp", label: "RPP Saya", icon: FileText },
    { href: "/guru/referensi", label: "Referensi", icon: Search },
  ],
  kepala: [
    { href: "/kepala", label: "Dashboard", icon: LayoutDashboard },
  ],
  pj: [
    { href: "/pj", label: "Dashboard", icon: LayoutDashboard },
    { href: "/jadwal", label: "Jadwal", icon: CalendarClock },
  ],
};

const BRAND = "Sinkronisasi RPP";
const PANEL_LABEL: Record<ShellVariant, string> = {
  admin: "Admin Panel",
  guru: "Portal Guru",
  kepala: "Kepala Sekolah",
  pj: "PJ Diniyyah",
};

export function Sidebar({
  variant,
}: {
  variant: ShellVariant;
}) {
  const nav = NAVS[variant];
  const pathname = usePathname();
  const { isExpanded, isHovered, isMobile, isMobileOpen, setIsHovered } = useSidebar();

  const active = (href: string) =>
    ROOTS.includes(href) ? pathname === href : pathname.startsWith(href);

  // Lebar: 290px saat terbuka (desktop expand / mobile drawer / hover-expand), 90px saat collapse.
  const width = isMobileOpen || (isExpanded && !isMobile) || isHovered ? 290 : 90;
  // Saat hover-expand dari kondisi collapse, sidebar overlay konten (z-40 + shadow).
  const overlay = !isMobile && !isExpanded && isHovered;

  return (
    <aside
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      className={cn(
        "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-900",
        isMobile && !isMobileOpen && "-translate-x-full",
        overlay && "shadow-theme-xl",
      )}
      style={{ width }}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 px-5 dark:border-gray-800",
          !isExpanded && !isMobileOpen && !isHovered && "justify-center px-0",
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-theme-sm">
          <FileText className="h-5 w-5" />
        </div>
        {(isExpanded || isMobileOpen || isHovered) && (
          <div className="leading-tight overflow-hidden">
            <div className="truncate text-sm font-bold tracking-wide text-gray-800 dark:text-white/90">{BRAND}</div>
            <div className="truncate text-xs text-gray-500 dark:text-gray-400">{PANEL_LABEL[variant]}</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {nav.map((n) => {
            const Icon = n.icon;
            const isActive = active(n.href);
            const showLabel = isExpanded || isMobileOpen || isHovered;
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={isActive ? "page" : undefined}
                title={!showLabel ? n.label : undefined}
                className={cn(
                  "menu-item group",
                  isActive ? "menu-item-active" : "menu-item-inactive",
                  !showLabel && "justify-center px-0",
                )}
              >
                <Icon
                  className={cn(
                    "menu-item-icon menu-item-icon-size shrink-0",
                    isActive ? "menu-item-icon-active" : "menu-item-icon-inactive",
                  )}
                />
                <span className={cn("truncate", !showLabel && "sr-only")}>{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}