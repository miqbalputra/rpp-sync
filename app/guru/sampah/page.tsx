// Sampah Guru: daftar RPP milik sendiri yang sudah dihapus (soft-delete).
// Bisa dipulihkan atau dihapus permanen (dengan konfirmasi ketat ketik-nama).
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGuruIdFromSession } from "@/lib/rpp/queries";
import { restoreRpp, permanentDeleteRpp } from "./actions";
import { PageHeader, Card, EmptyState, ErrorBanner } from "@/components/admin/ui";
import PermanentDeleteButton from "@/components/admin/PermanentDeleteButton";
import { AiBadge } from "@/components/rpp/AiBadge";
import {
  Table, TableHead, TableHeader, TableBody, TableRow, TableCell,
} from "@/components/ui/table";

export const metadata = { title: "Sampah — Guru" };

export default async function GuruSampahPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await auth();
  const guruId = await getGuruIdFromSession(session);

  const rpp = guruId
    ? await prisma.rpp.findMany({
        where: { guruId, deletedAt: { not: null } },
        orderBy: { deletedAt: "desc" },
        include: { mapel: true, kelas: true },
      })
    : [];

  return (
    <div>
      <PageHeader
        title="Sampah"
        subtitle={`${rpp.length} RPP terhapus — bisa dipulihkan atau dihapus permanen`}
      />
      <ErrorBanner message={error ? decodeURIComponent(error) : null} />

      {!guruId ? (
        <Card><EmptyState>Profil Guru tidak ditemukan. Hubungi Admin.</EmptyState></Card>
      ) : rpp.length === 0 ? (
        <Card><EmptyState>Sampah kosong. RPP yang Anda hapus akan muncul di sini.</EmptyState></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. RPP</TableHead>
                <TableHead>Materi</TableHead>
                <TableHead>Mapel / Kelas</TableHead>
                <TableHead>Dihapus</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rpp.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.noRpp ?? "—"}</TableCell>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <span>{r.materi}</span>
                      {r.dibuatDenganAI && <AiBadge />}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{r.mapel.namaMapel} / {r.kelas.namaKelas}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {r.deletedAt ? new Date(r.deletedAt).toLocaleDateString("id-ID") : "—"}
                  </TableCell>
                  <TableCell className="text-right space-x-3 whitespace-nowrap">
                    <form action={restoreRpp.bind(null, r.id) as unknown as (fd: FormData) => Promise<void>} className="inline">
                      <button type="submit" className="text-primary text-sm font-medium hover:underline">Pulihkan</button>
                    </form>
                    <PermanentDeleteButton
                      action={permanentDeleteRpp.bind(null, r.id)}
                      confirmName={r.materi}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}