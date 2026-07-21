// Tombol logout via server action (NextAuth v5 signOut).
import { logoutAction } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";

export default function LogoutButton({ className = "" }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={cn(
          "inline-flex h-9 items-center justify-center rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted",
          className
        )}
      >
        Keluar
      </button>
    </form>
  );
}