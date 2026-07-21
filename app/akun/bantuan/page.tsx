// Bantuan: kirim pesan ke Admin / PJ Diniyyah (2-way via notifikasi).
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { redirectPathForRole } from "@/lib/auth";
import { kirimHelp } from "@/app/notifikasi/actions";
import {
  PageHeader, FieldLabel, inputClass, Button, ErrorBanner, SuccessBanner, CancelLink, BackLink, EmptyState,
} from "@/components/admin/ui";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LifeBuoy, Inbox, Clock } from "lucide-react";

export const metadata = { title: "Bantuan — Sinkronisasi RPP" };

// Label tujuan (untukRole) untuk baris pesan terkirim. BOTH tidak disimpan
// sebagai satu baris — kirimHelp membuat 2 baris (ADMIN + PJ_DINIYYAH).
const TUJUAN_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  PJ_DINIYYAH: "PJ Diniyyah",
};

export default async function BantuanPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { error, ok } = await searchParams;

  const terkirim = await prisma.notifikasi.findMany({
    where: { dariUserId: session.user.id, tipe: "HELP" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const dashboard = redirectPathForRole(session.user.role);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackLink href={dashboard} />
      <PageHeader title="Bantuan" subtitle="Kirim pesan ke Admin atau PJ Diniyyah" />
      <ErrorBanner message={error ? decodeURIComponent(error) : null} />
      <SuccessBanner message={ok ? "Pesan terkirim. Admin / PJ Diniyyah akan melihatnya di kotak notifikasi mereka." : null} />

      {/* Tulis pesan */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 border-b border-gray-100 dark:border-gray-800">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <LifeBuoy className="h-5 w-5" />
          </span>
          <div className="space-y-0.5">
            <CardTitle>Tulis Pesan</CardTitle>
            <CardDescription>Pesan dikirim ke kotak notifikasi tujuan.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form action={kirimHelp} className="space-y-5">
            <div>
              <FieldLabel htmlFor="tujuan">Tujuan</FieldLabel>
              <select id="tujuan" name="tujuan" required defaultValue="" className={inputClass}>
                <option value="" disabled>— pilih tujuan —</option>
                <option value="ADMIN">Admin</option>
                <option value="PJ_DINIYYAH">PJ Diniyyah (Kurikulum)</option>
                <option value="BOTH">Admin &amp; PJ Diniyyah</option>
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="judul">Judul</FieldLabel>
              <input id="judul" name="judul" required maxLength={200} placeholder="Subjek pesan" className={inputClass} />
            </div>
            <div>
              <FieldLabel htmlFor="isi">Pesan</FieldLabel>
              <textarea
                id="isi"
                name="isi"
                required
                maxLength={2000}
                rows={5}
                placeholder="Tuliskan pertanyaan atau permintaan bantuan…"
                className={inputClass + " h-auto min-h-[120px] py-2.5 resize-y"}
              />
            </div>
            <CardFooter className="gap-2 px-0 pt-1">
              <Button type="submit">Kirim Pesan</Button>
              <CancelLink href={dashboard} />
            </CardFooter>
          </form>
        </CardContent>
      </Card>

      {/* Pesan terkirim */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300">
              <Inbox className="h-5 w-5" />
            </span>
            <div className="space-y-0.5">
              <CardTitle>Pesan Terkirim</CardTitle>
              <CardDescription>Riwayat pesan bantuan yang Anda kirim.</CardDescription>
            </div>
          </div>
          {terkirim.length > 0 && (
            <Badge variant="secondary" className="px-2.5 py-1">
              {terkirim.length} pesan
            </Badge>
          )}
        </CardHeader>
        {terkirim.length === 0 ? (
          <EmptyState>Belum ada pesan terkirim.</EmptyState>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {terkirim.map((p) => (
              <li key={p.id} className="px-6 py-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-foreground">{p.judul}</span>
                  <Badge variant="info" className="shrink-0">
                    {TUJUAN_LABEL[p.untukRole ?? ""] ?? "—"}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.isi}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(p.createdAt).toLocaleString("id-ID")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}