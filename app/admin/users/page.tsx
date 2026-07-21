// Daftar User.
import { prisma } from "@/lib/db";
import { deleteUser } from "./actions";
import { PageHeader, Card, PrimaryLink, EmptyState, ErrorBanner } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import { Role } from "@prisma/client";
import {
  Table, TableHead, TableHeader, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export const metadata = { title: "User — Admin" };

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  KEPALA_SEKOLAH: "Kepala Sekolah",
  PJ_DINIYYAH: "PJ Diniyyah",
  GURU: "Guru",
};
const ROLE_VARIANT: Record<Role, "default" | "info" | "warning" | "success"> = {
  ADMIN: "default",
  KEPALA_SEKOLAH: "info",
  PJ_DINIYYAH: "warning",
  GURU: "success",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const users = await prisma.user.findMany({
    orderBy: [{ nama: "asc" }],
    select: {
      id: true, nama: true, email: true, username: true,
      role: true, gender: true, aktif: true, guru: { select: { id: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="User"
        subtitle={`${users.length} akun`}
        action={<PrimaryLink href="/admin/users/baru"><Plus className="h-4 w-4" />Tambah User</PrimaryLink>}
      />
      <ErrorBanner message={error ? decodeURIComponent(error) : null} />
      <Card>
        {users.length === 0 ? (
          <EmptyState>Belum ada user.</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Username / Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-foreground">{u.nama}</TableCell>
                  <TableCell>
                    <div className="font-mono text-xs text-foreground">{u.username}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.gender ? (u.gender === "IKHWAN" ? "Ikhwan" : "Akhwat") : "—"}
                  </TableCell>
                  <TableCell>
                    {u.aktif ? (
                      <Badge variant="success">Aktif</Badge>
                    ) : (
                      <Badge variant="secondary">Nonaktif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-3 whitespace-nowrap">
                    <a href={`/admin/users/${u.id}/edit`} className="text-primary text-sm font-medium hover:underline">
                      Edit
                    </a>
                    <DeleteButton
                      action={deleteUser.bind(null, u.id)}
                      confirmMessage={`Hapus user "${u.nama}"? Tindakan ini permanen.`}
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