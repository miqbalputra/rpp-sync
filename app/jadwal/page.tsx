// Daftar Jadwal Mengajar (Admin & PJ Diniyyah).
import { listJadwalForAdmin } from "@/lib/jadwal/queries";
import { HARI_LABEL } from "@/lib/jadwal/schema";
import { deleteJadwal } from "./actions";
import { requireAdminOrPj } from "@/lib/auth-guard";
import { PageHeader, Card, PrimaryLink, EmptyState } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import {
  Table, TableHead, TableHeader, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, CalendarClock } from "lucide-react";

export const metadata = { title: "Jadwal Mengajar — Sinkronisasi RPP" };

export default async function JadwalPage() {
  await requireAdminOrPj();
  const jadwal = await listJadwalForAdmin();

  return (
    <div>
      <PageHeader
        title="Jadwal Mengajar"
        subtitle="Hari & jam mengajar per penugasan — memicu pengingat bila RPP belum dibuat"
        action={
          <div className="flex items-center gap-2">
            {jadwal.length > 0 && <Badge variant="secondary" className="px-3 py-1.5">{jadwal.length} slot</Badge>}
            <PrimaryLink href="/jadwal/baru"><Plus className="h-4 w-4" />Tambah Jadwal</PrimaryLink>
          </div>
        }
      />

      <Card>
        {jadwal.length === 0 ? (
          <EmptyState>
            <span className="inline-flex flex-col items-center gap-2">
              <CalendarClock className="h-8 w-8 text-muted-foreground" />
              Belum ada jadwal. Tambahkan slot hari &amp; jam mengajar per penugasan.
            </span>
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guru</TableHead>
                <TableHead>Mapel</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Hari</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jadwal.map((j) => {
                const p = j.penugasan;
                return (
                  <TableRow key={j.id}>
                    <TableCell className="font-medium text-foreground">
                      {p.guru.namaTampil}
                    </TableCell>
                    <TableCell className="text-foreground">{p.mapel.namaMapel}</TableCell>
                    <TableCell>
                      <span className="text-foreground">{p.kelas.namaKelas}</span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({p.kelas.gender === "IKHWAN" ? "Ikhwan" : "Akhwat"})
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{HARI_LABEL[j.hari]}</Badge>
                    </TableCell>
                    <TableCell className="text-foreground tabular-nums">
                      {j.jamMulai} – {j.jamSelesai}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteButton
                        action={deleteJadwal.bind(null, j.id)}
                        confirmMessage={`Hapus jadwal ${HARI_LABEL[j.hari]} ${j.jamMulai}–${j.jamSelesai} (${p.guru.namaTampil} → ${p.mapel.namaMapel} → ${p.kelas.namaKelas})?`}
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