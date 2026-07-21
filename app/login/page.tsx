// Halaman login (PRD Tahap 2). Server action memanggil signIn NextAuth v5.
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { BookOpenText } from "lucide-react";
import { LoginCard } from "./_LoginCard";

export const metadata = { title: "Login — Sinkronisasi RPP" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;

  async function loginAction(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const callbackUrl = String(formData.get("callbackUrl") ?? "/");
    try {
      // redirectTo "/" — proxy akan arahkan ke dashboard sesuai role.
      await signIn("credentials", { email, password, redirectTo: callbackUrl });
    } catch (error) {
      if (error instanceof AuthError) {
        const msg =
          error.type === "CredentialsSignin"
            ? "Email atau password salah."
            : "Terjadi kesalahan saat login.";
        return redirect(`/login?error=${encodeURIComponent(msg)}`);
      }
      throw error;
    }
  }

  const errMsg = params.error ? decodeURIComponent(params.error) : null;

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Panel branding */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-primary text-primary-foreground p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #ffffff 0, transparent 40%), radial-gradient(circle at 80% 70%, #6ee7b7 0, transparent 45%)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <BookOpenText className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold tracking-wide">Sinkronisasi RPP</div>
            <div className="text-xs text-primary-foreground/80">Griya Qur&apos;an Tunas Ilmu</div>
          </div>
        </div>

        <div className="relative space-y-4">
          <h2 className="text-3xl font-bold leading-tight">
            Rencana Pelaksanaan Pembelajaran, terarsip & tersinkron.
          </h2>
          <p className="text-sm text-primary-foreground/80 max-w-md">
            Buat, ajukan, dan ekspor RPP dalam satu tempat. Referensi antar guru,
            recycle bin, dan ekspor Gambar / PDF / Word siap pakai.
          </p>
        </div>

        <div className="relative text-xs text-primary-foreground/70">
          Purbalingga — {new Date().getFullYear()}
        </div>
      </div>

      {/* Panel form */}
      <div className="flex items-center justify-center bg-gray-50 p-6 sm:p-10 dark:bg-gray-dark">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white">
              <BookOpenText className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-wide text-gray-800 dark:text-white/90">Sinkronisasi RPP</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Griya Qur&apos;an Tunas Ilmu</div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md sm:p-8 dark:border-gray-800 dark:bg-gray-900">
            <LoginCard action={loginAction} callbackUrl={params.callbackUrl ?? "/"} error={errMsg} />
          </div>
        </div>
      </div>
    </main>
  );
}