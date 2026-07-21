// Recycle Bin Admin: daftar semua RPP terhapus dari semua guru.
import { prisma } from "@/lib/db";
import { restoreRpp, permanentDeleteRpp } from "./actions";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";
import PermanentDeleteButton from "@/components/admin/PermanentDeleteButton";
import {
  Table, TableHead, TableHeader, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Sampah / Recycle Bin — Admin" };

export default async function RecycleBinPage() {
  const rpp = await prisma.rpp.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    include: { guru: { select: { namaTampil: true } }, mapel: true, kelas: true },
  });

  return (
    <div>
      <PageHeader
        title="Sampah / Recycle Bin"
        subtitle={`${rpp.length} RPP terhapus — bisa dipulihkan atau dihapus permanen`}
      />
      <Card>
        {rpp.length === 0 ? (
          <EmptyState>Sampah kosong. RPP yang dihapus guru akan muncul di sini.</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Materi</TableHead>
                <TableHead>Guru Pemilik</TableHead>
                <TableHead>Mapel / Kelas</TableHead>
                <TableHead>Dihapus</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rpp.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-foreground">{r.materi}</TableCell>
                  <TableCell className="text-muted-foreground">{r.guru?.namaTampil ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {r.mapel.namaMapel} / {r.kelas.namaKelas}
                  </TableCell>
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
        )}
      </Card>
    </div>
  );
}