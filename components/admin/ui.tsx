// Komponen UI kecil bersama untuk halaman Admin.
// Re-export dari design system baru (components/ui) + helper lama yang masih dipakai.
import Link from "next/link";
import { ReactNode } from "react";
import { Card as UICard } from "@/components/ui/card";
import { Button as UIButton, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// Card lama — render sebagai div tanpa padding (konsumen atur sendiri).
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <UICard className={cn("p-0", className)}>{children}</UICard>;
}

export function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant: "default" }))}>
      {children}
    </Link>
  );
}

export function CancelLink({ href, children = "Batal" }: { href: string; children?: ReactNode }) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant: "outline" }))}>
      {children}
    </Link>
  );
}

export function BackLink({ href, children = "Kembali ke Panel" }: { href: string; children?: ReactNode }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
    >
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M12.78 5.22a.75.75 0 0 1 0 1.06L9.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
      </svg>
      {children}
    </Link>
  );
}

export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground mb-1.5">
      {children}
    </label>
  );
}

// Tetap dipakai oleh form lama sebelum migrasi penuh.
export const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 transition focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

export function Button({
  children,
  variant = "primary",
  type = "button",
  className = "",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  type?: "button" | "submit";
  className?: string;
}) {
  const variantMap = {
    primary: "default",
    secondary: "outline",
    danger: "destructive",
  } as const;
  return (
    <UIButton
      type={type}
      variant={variantMap[variant]}
      className={className}
    >
      {children}
    </UIButton>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="text-center py-12 text-muted-foreground text-sm">{children}</div>
  );
}

export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400">
      {message}
    </div>
  );
}

export function SuccessBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/15 dark:text-success-400">
      {message}
    </div>
  );
}

// Label peran untuk tampilan (profil akun dll).
export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  KEPALA_SEKOLAH: "Kepala Sekolah",
  PJ_DINIYYAH: "PJ Diniyyah",
  GURU: "Guru",
};