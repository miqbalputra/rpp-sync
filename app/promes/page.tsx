// Pengelolaan satu link Promes aktif untuk setiap pasangan Mapel + Kelas.
import Link from "next/link";
import { ExternalLink, Link2, Pencil, Plus } from "lucide-react";
import { requireAdminOrPj } from "@/lib/auth-guard";
import { listActivePromes } from "@/lib/promes/queries";
import { deletePromes } from "./actions";
import { PageHeader, Card, EmptyState, PrimaryLink } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = { title: "Promes — Sinkronisasi RPP" };

export default async function PromesPage() {
  await requireAdminOrPj();
  const promes = await listActivePromes();

  return (
    <div>
      <PageHeader
        title="Program Semester (Promes)"
        subtitle={`${promes.length} link Promes aktif`}
        action={<PrimaryLink href="/promes/baru"><Plus className="h-4 w-4" />Tambah Promes</PrimaryLink>}
      />

      <Card>
        {promes.length === 0 ? (
          <EmptyState>
            <span className="inline-flex flex-col items-center gap-2">
              <Link2 className="h-8 w-8" />
              Belum ada link Promes. Tambahkan link sesuai Mapel dan Kelas.
            </span>
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mapel</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Link Promes</TableHead>
                <TableHead>Diperbarui</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promes.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-foreground">{item.mapel.namaMapel}</TableCell>
                  <TableCell>
                    <span className="text-foreground">{item.kelas.namaKelas}</span>
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({item.kelas.gender === "IKHWAN" ? "Ikhwan" : "Akhwat"})
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <span className="truncate">{item.url}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(item.updatedAt).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Link href={`/promes/${item.id}/edit`} className="mr-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                    <DeleteButton
                      action={deletePromes.bind(null, item.id)}
                      confirmMessage={`Hapus link Promes ${item.mapel.namaMapel} — ${item.kelas.namaKelas}? RPP tidak akan terhapus.`}
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
