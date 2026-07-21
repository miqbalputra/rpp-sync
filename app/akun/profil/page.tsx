// Edit Profil (self-service): nama, email, username, gender.
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { redirectPathForRole } from "@/lib/auth";
import { updateProfil } from "../actions";
import {
  PageHeader, FieldLabel, inputClass, Button, ErrorBanner, SuccessBanner, CancelLink, BackLink, ROLE_LABEL,
} from "@/components/admin/ui";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserRound } from "lucide-react";

export const metadata = { title: "Edit Profil — Sinkronisasi RPP" };

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { error, ok } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { nama: true, email: true, username: true, gender: true, role: true },
  });
  if (!user) redirect("/login");

  const dashboard = redirectPathForRole(user.role);

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href={dashboard} />
      <PageHeader
        title="Edit Profil"
        subtitle="Kelola identitas akun Anda"
        action={
          <Badge variant="info" className="px-3 py-1 text-xs">
            {ROLE_LABEL[user.role] ?? user.role}
          </Badge>
        }
      />
      <ErrorBanner message={error ? decodeURIComponent(error) : null} />
      <SuccessBanner message={ok ? "Profil berhasil diperbarui." : null} />

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 border-b border-gray-100 dark:border-gray-800">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <UserRound className="h-5 w-5" />
          </span>
          <div className="space-y-0.5">
            <CardTitle>Identitas</CardTitle>
            <CardDescription>Perubahan nama akan otomatis tersinkron ke profil guru.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form action={updateProfil} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="nama">Nama Lengkap</FieldLabel>
                <input id="nama" name="nama" required defaultValue={user.nama} autoFocus className={inputClass} />
              </div>
              <div>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <input id="username" name="username" required defaultValue={user.username} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <input id="email" name="email" type="email" required defaultValue={user.email} className={inputClass} />
              </div>
              <div>
                <FieldLabel htmlFor="gender">Gender</FieldLabel>
                <select id="gender" name="gender" defaultValue={user.gender ?? ""} className={inputClass}>
                  <option value="">— pilih —</option>
                  <option value="IKHWAN">Ikhwan</option>
                  <option value="AKHWAT">Akhwat</option>
                </select>
              </div>
            </div>
            <CardFooter className="gap-2 px-0 pt-1">
              <Button type="submit">Simpan Perubahan</Button>
              <CancelLink href={dashboard} />
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}