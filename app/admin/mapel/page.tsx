// Daftar Mapel + tombol hapus.
import { prisma } from "@/lib/db";
import { deleteMapel } from "./actions";
import { PageHeader, Card, PrimaryLink, EmptyState, ErrorBanner } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import {
  Table, TableHead, TableHeader, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

export const metadata = { title: "Mapel — Admin" };

export default async function MapelPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const mapel = await prisma.mapel.findMany({
    orderBy: { namaMapel: "asc" },
    include: { _count: { select: { penugasan: true, rpp: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Mata Pelajaran"
        subtitle={`${mapel.length} mapel`}
        action={<PrimaryLink href="/admin/mapel/baru"><Plus className="h-4 w-4" />Tambah Mapel</PrimaryLink>}
      />
      <ErrorBanner message={error ? decodeURIComponent(error) : null} />
      <Card>
        {mapel.length === 0 ? (
          <EmptyState>Belum ada mapel. Klik &quot;Tambah Mapel&quot; untuk membuat.</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Mapel</TableHead>
                <TableHead className="text-center">Penugasan</TableHead>
                <TableHead className="text-center">RPP</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mapel.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium text-foreground">{m.namaMapel}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{m._count.penugasan}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{m._count.rpp}</TableCell>
                  <TableCell className="text-right space-x-3 whitespace-nowrap">
                    <a href={`/admin/mapel/${m.id}/edit`} className="text-primary text-sm font-medium hover:underline">Edit</a>
                    <DeleteButton
                      action={deleteMapel.bind(null, m.id)}
                      confirmMessage={`Hapus mapel "${m.namaMapel}"?`}
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