// Daftar Kelas.
import { prisma } from "@/lib/db";
import { deleteKelas } from "./actions";
import { PageHeader, Card, PrimaryLink, EmptyState, ErrorBanner } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import {
  Table, TableHead, TableHeader, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export const metadata = { title: "Kelas — Admin" };

export default async function KelasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const kelas = await prisma.kelas.findMany({
    orderBy: [{ tahunAjaran: "desc" }, { namaKelas: "asc" }],
    include: { _count: { select: { penugasan: true, rpp: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Kelas"
        subtitle={`${kelas.length} kelas`}
        action={<PrimaryLink href="/admin/kelas/baru"><Plus className="h-4 w-4" />Tambah Kelas</PrimaryLink>}
      />
      <ErrorBanner message={error ? decodeURIComponent(error) : null} />
      <Card>
        {kelas.length === 0 ? (
          <EmptyState>Belum ada kelas.</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Kelas</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Tahun Ajaran</TableHead>
                <TableHead className="text-center">Penugasan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kelas.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium text-foreground">{k.namaKelas}</TableCell>
                  <TableCell>
                    <Badge variant={k.gender === "IKHWAN" ? "info" : "danger"}>
                      {k.gender === "IKHWAN" ? "Ikhwan" : "Akhwat"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{k.semester}</TableCell>
                  <TableCell className="text-muted-foreground">{k.tahunAjaran}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{k._count.penugasan}</TableCell>
                  <TableCell className="text-right space-x-3 whitespace-nowrap">
                    <a href={`/admin/kelas/${k.id}/edit`} className="text-primary text-sm font-medium hover:underline">Edit</a>
                    <DeleteButton
                      action={deleteKelas.bind(null, k.id)}
                      confirmMessage={`Hapus kelas "${k.namaKelas}"?`}
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