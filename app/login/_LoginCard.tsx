"use client";
import { useTransition, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "./_GoogleButton";

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
    <div className="space-y-5">
      <GoogleButton callbackUrl={callbackUrl} />

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200 dark:border-gray-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-400 dark:bg-gray-900 dark:text-gray-500">
            atau
          </span>
        </div>
      </div>

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
        <Label htmlFor="identifier">Username atau Email</Label>
        <Input
          id="identifier"
          name="identifier"
          type="text"
          required
          autoComplete="username"
          autoFocus
          placeholder="username atau email@sekolah.sch.id"
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
    </form>
    </div>
  );
}