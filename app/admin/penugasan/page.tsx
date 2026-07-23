// Daftar Penugasan.
import { prisma } from "@/lib/db";
import { deletePenugasan } from "./actions";
import { PageHeader, Card, PrimaryLink, EmptyState } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import {
  Table, TableHead, TableHeader, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle } from "lucide-react";

export const metadata = { title: "Penugasan — Admin" };

export default async function PenugasanPage() {
  const [penugasan, guruList, mapelList, kelasList] = await Promise.all([
    prisma.penugasan.findMany({
      where: {
        deletedAt: null,
        guru: { deletedAt: null },
        mapel: { deletedAt: null },
        kelas: { deletedAt: null },
      },
      orderBy: [{ guru: { namaTampil: "asc" } }],
      include: { guru: { include: { user: { select: { nama: true, gender: true } } } }, mapel: true, kelas: true },
    }),
    prisma.guru.findMany({ where: { deletedAt: null }, orderBy: { namaTampil: "asc" }, include: { user: { select: { nama: true, gender: true } } } }),
    prisma.mapel.findMany({ where: { deletedAt: null }, orderBy: { namaMapel: "asc" } }),
    prisma.kelas.findMany({ where: { deletedAt: null }, orderBy: { namaKelas: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Penugasan"
        subtitle={`${penugasan.length} penugasan — guru × mapel × kelas`}
        action={<PrimaryLink href="/admin/penugasan/baru"><Plus className="h-4 w-4" />Tambah Penugasan</PrimaryLink>}
      />
      {guruList.length === 0 || mapelList.length === 0 || kelasList.length === 0 ? (
        <Card className="p-4 mb-4">
          <div className="flex items-start gap-3 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Sebelum menambah penugasan, pastikan sudah ada minimal 1 Guru, 1 Mapel, dan 1 Kelas.</span>
          </div>
        </Card>
      ) : null}

      <Card>
        {penugasan.length === 0 ? (
          <EmptyState>Belum ada penugasan.</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guru</TableHead>
                <TableHead>Mapel</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {penugasan.map((p) => {
                const genderGuru = p.guru.user.gender;
                const genderKelas = p.kelas.gender;
                const mismatch = genderGuru && genderGuru !== genderKelas;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-foreground">
                      {p.guru.namaTampil}
                      <div className="text-xs text-muted-foreground font-normal">
                        {genderGuru ? (genderGuru === "IKHWAN" ? "Ikhwan" : "Akhwat") : "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{p.mapel.namaMapel}</TableCell>
                    <TableCell>
                      <span className="text-foreground">{p.kelas.namaKelas}</span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({p.kelas.gender === "IKHWAN" ? "Ikhwan" : "Akhwat"})
                      </span>
                    </TableCell>
                    <TableCell>
                      {mismatch ? (
                        <Badge variant="warning">Lintas gender (pengecualian)</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteButton
                        action={deletePenugasan.bind(null, p.id)}
                        confirmMessage={`Hapus penugasan ${p.guru.namaTampil} → ${p.mapel.namaMapel} → ${p.kelas.namaKelas}? Dipindahkan ke Sampah; jadwal terkait disembunyikan. Bisa dipulihkan.`}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}