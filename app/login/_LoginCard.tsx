"use client";
import { useTransition, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginCard({
  action,
  callbackUrl,
  error,
}: {
  action: (formData: FormData) => Promise<void>;
  callbackUrl: string;
  error: string | null;
}) {
  const [showPw, setShowPw] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={action}
      className="space-y-5"
      onSubmit={() => startTransition(() => {})}
    >
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white/90">Masuk</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Gunakan akun yang diberikan Admin untuk masuk.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400">
          {error}
        </div>
      )}

      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          placeholder="admin@gqtunasilmu.sch.id"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
            tabIndex={-1}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Memproses…
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            Masuk
          </>
        )}
      </Button>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        Akun demo Admin — <span className="font-mono">admin@gqtunasilmu.sch.id</span> /{" "}
        <span className="font-mono">admin123</span>
      </p>
    </form>
  );
}