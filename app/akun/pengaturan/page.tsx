// Pengaturan Akun: ubah password + preferensi notifikasi overdue.
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { redirectPathForRole } from "@/lib/auth";
import { ubahPassword, ubahPreferensi } from "../actions";
import {
  PageHeader, FieldLabel, inputClass, Button, ErrorBanner, SuccessBanner, CancelLink, BackLink,
} from "@/components/admin/ui";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { KeyRound, Bell } from "lucide-react";

export const metadata = { title: "Pengaturan Akun — Sinkronisasi RPP" };

export default async function PengaturanPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { error, ok } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { prefNotifOverdue: true, role: true },
  });
  if (!user) redirect("/login");
  const dashboard = redirectPathForRole(user.role);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackLink href={dashboard} />
      <PageHeader title="Pengaturan Akun" subtitle="Keamanan & notifikasi" />
      <ErrorBanner message={error ? decodeURIComponent(error) : null} />
      <SuccessBanner message={ok ? "Pengaturan berhasil disimpan." : null} />

      {/* Ubah Password */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 border-b border-gray-100 dark:border-gray-800">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400">
            <KeyRound className="h-5 w-5" />
          </span>
          <div className="space-y-0.5">
            <CardTitle>Ubah Password</CardTitle>
            <CardDescription>Gunakan password baru minimal 6 karakter.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form action={ubahPassword} className="space-y-5">
            <div>
              <FieldLabel htmlFor="passwordLama">Password Lama</FieldLabel>
              <input id="passwordLama" name="passwordLama" type="password" required className={inputClass} />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="passwordBaru">Password Baru</FieldLabel>
                <input id="passwordBaru" name="passwordBaru" type="password" required placeholder="minimal 6 karakter" className={inputClass} />
              </div>
              <div>
                <FieldLabel htmlFor="konfirmasi">Konfirmasi Password Baru</FieldLabel>
                <input id="konfirmasi" name="konfirmasi" type="password" required className={inputClass} />
              </div>
            </div>
            <CardFooter className="gap-2 px-0 pt-1">
              <Button type="submit">Ubah Password</Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>

      {/* Preferensi Notifikasi */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 border-b border-gray-100 dark:border-gray-800">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <Bell className="h-5 w-5" />
          </span>
          <div className="space-y-0.5">
            <CardTitle>Preferensi Notifikasi</CardTitle>
            <CardDescription>Atur pengingat yang ingin Anda terima.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form action={ubahPreferensi} className="space-y-5">
            <label
              htmlFor="prefNotifOverdue"
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-brand-300 hover:bg-brand-50/40 dark:border-gray-800 dark:hover:border-brand-800 dark:hover:bg-white/[0.03]"
            >
              <input
                id="prefNotifOverdue"
                name="prefNotifOverdue"
                type="checkbox"
                defaultChecked={user.prefNotifOverdue}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 accent-brand-500 focus:ring-brand-500/30"
              />
              <span className="space-y-1">
                <span className="block text-sm font-medium text-foreground">
                  Pengingat RPP belum dibuat
                </span>
                <span className="block text-sm text-muted-foreground">
                  Beri tahu saya ketika RPP belum dibuat melewati jam mengajar yang terjadwal.
                </span>
              </span>
            </label>
            <CardFooter className="gap-2 px-0 pt-1">
              <Button type="submit">Simpan Preferensi</Button>
              <CancelLink href={dashboard} />
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}