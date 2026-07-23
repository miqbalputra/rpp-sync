// Recycle Bin Admin: semua entitas terhapus (RPP, User, Mapel, Kelas, Penugasan, Jadwal).
// Setiap item bisa dipulihkan atau dihapus permanen (dengan konfirmasi ketat ketik-nama).
import { prisma } from "@/lib/db";
import {
  restoreRpp, permanentDeleteRpp,
  restoreUser, permanentDeleteUser,
  restoreMapel, permanentDeleteMapel,
  restoreKelas, permanentDeleteKelas,
  restorePenugasan, permanentDeletePenugasan,
  restoreJadwal, permanentDeleteJadwal,
} from "./actions";
import { PageHeader, Card, EmptyState, ErrorBanner } from "@/components/admin/ui";
import PermanentDeleteButton from "@/components/admin/PermanentDeleteButton";
import { AiBadge } from "@/components/rpp/AiBadge";
import { HARI_LABEL } from "@/lib/jadwal/schema";
import {
  Table, TableHead, TableHeader, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import { Role } from "@prisma/client";
import type { ReactNode } from "react";

export const metadata = { title: "Sampah / Recycle Bin — Admin" };

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin", KEPALA_SEKOLAH: "Kepala Sekolah", PJ_DINIYYAH: "PJ Diniyyah", GURU: "Guru",
};

function tanggalCell(d: Date | null) {
  return d ? new Date(d).toLocaleDateString("id-ID") : "—";
}

// Tombol Pulihkan (form submit).
function RestoreButton({ action }: { action: (fd: FormData) => Promise<unknown> }) {
  return (
    <form action={action as unknown as (fd: FormData) => Promise<void>} className="inline">
      <button type="submit" className="text-primary text-sm font-medium hover:underline">Pulihkan</button>
    </form>
  );
}

function SectionCard({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground">{count} item</span>
      </div>
      {children}
    </Card>
  );
}

export default async function RecycleBinPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [rpp, users, mapel, kelas, penugasan, jadwal] = await Promise.all([
    prisma.rpp.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      include: { guru: { select: { namaTampil: true } }, mapel: true, kelas: true },
    }),
    prisma.user.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      select: { id: true, nama: true, email: true, username: true, role: true, deletedAt: true },
    }),
    prisma.mapel.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: "desc" } }),
    prisma.kelas.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: "desc" } }),
    prisma.penugasan.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      include: { guru: { select: { namaTampil: true } }, mapel: true, kelas: true },
    }),
    prisma.jadwal.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      include: { penugasan: { include: { guru: { select: { namaTampil: true } }, mapel: true, kelas: true } } },
    }),
  ]);

  const total = rpp.length + users.length + mapel.length + kelas.length + penugasan.length + jadwal.length;

  return (
    <div>
      <PageHeader
        title="Sampah / Recycle Bin"
        subtitle={`${total} item terhapus — bisa dipulihkan atau dihapus permanen (konfirmasi ketat)`}
      />
      <ErrorBanner message={error ? decodeURIComponent(error) : null} />

      {total === 0 ? (
        <Card>
          <EmptyState>Sampah kosong. Data yang dihapus dari sistem akan muncul di sini.</EmptyState>
        </Card>
      ) : (
        <>
          {/* RPP */}
          {rpp.length > 0 && (
            <SectionCard title="RPP" count={rpp.length}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. RPP</TableHead>
                    <TableHead>Materi</TableHead>
                    <TableHead>Guru</TableHead>
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
                      <TableCell className="text-muted-foreground">{r.guru?.namaTampil ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{r.mapel.namaMapel} / {r.kelas.namaKelas}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{tanggalCell(r.deletedAt)}</TableCell>
                      <TableCell className="text-right space-x-3 whitespace-nowrap">
                        <RestoreButton action={restoreRpp.bind(null, r.id)} />
                        <PermanentDeleteButton action={permanentDeleteRpp.bind(null, r.id)} confirmName={r.materi} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          )}

          {/* User */}
          {users.length > 0 && (
            <SectionCard title="User / Akun" count={users.length}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Username / Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Dihapus</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-foreground">{u.nama}</TableCell>
                      <TableCell>
                        <div className="font-mono text-xs text-foreground">{u.username}</div>
                        <div className="text-xs text-muted-foreground">{u.email || "—"}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{ROLE_LABEL[u.role]}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{tanggalCell(u.deletedAt)}</TableCell>
                      <TableCell className="text-right space-x-3 whitespace-nowrap">
                        <RestoreButton action={restoreUser.bind(null, u.id)} />
                        <PermanentDeleteButton action={permanentDeleteUser.bind(null, u.id)} confirmName={u.nama} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          )}

          {/* Mapel */}
          {mapel.length > 0 && (
            <SectionCard title="Mata Pelajaran" count={mapel.length}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Mapel</TableHead>
                    <TableHead>Dihapus</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mapel.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium text-foreground">{m.namaMapel}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{tanggalCell(m.deletedAt)}</TableCell>
                      <TableCell className="text-right space-x-3 whitespace-nowrap">
                        <RestoreButton action={restoreMapel.bind(null, m.id)} />
                        <PermanentDeleteButton action={permanentDeleteMapel.bind(null, m.id)} confirmName={m.namaMapel} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          )}

          {/* Kelas */}
          {kelas.length > 0 && (
            <SectionCard title="Kelas" count={kelas.length}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Dihapus</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kelas.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-medium text-foreground">{k.namaKelas}</TableCell>
                      <TableCell className="text-muted-foreground">{k.gender === "IKHWAN" ? "Ikhwan" : "Akhwat"}</TableCell>
                      <TableCell className="text-muted-foreground">{k.semester}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{tanggalCell(k.deletedAt)}</TableCell>
                      <TableCell className="text-right space-x-3 whitespace-nowrap">
                        <RestoreButton action={restoreKelas.bind(null, k.id)} />
                        <PermanentDeleteButton action={permanentDeleteKelas.bind(null, k.id)} confirmName={k.namaKelas} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          )}

          {/* Penugasan */}
          {penugasan.length > 0 && (
            <SectionCard title="Penugasan" count={penugasan.length}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guru</TableHead>
                    <TableHead>Mapel</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Dihapus</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {penugasan.map((p) => {
                    const label = `${p.guru?.namaTampil ?? "—"} → ${p.mapel.namaMapel} → ${p.kelas.namaKelas}`;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-foreground">{p.guru?.namaTampil ?? "—"}</TableCell>
                        <TableCell className="text-foreground">{p.mapel.namaMapel}</TableCell>
                        <TableCell className="text-foreground">{p.kelas.namaKelas}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{tanggalCell(p.deletedAt)}</TableCell>
                        <TableCell className="text-right space-x-3 whitespace-nowrap">
                          <RestoreButton action={restorePenugasan.bind(null, p.id)} />
                          <PermanentDeleteButton action={permanentDeletePenugasan.bind(null, p.id)} confirmName={label} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </SectionCard>
          )}

          {/* Jadwal */}
          {jadwal.length > 0 && (
            <SectionCard title="Jadwal" count={jadwal.length}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guru</TableHead>
                    <TableHead>Mapel / Kelas</TableHead>
                    <TableHead>Hari</TableHead>
                    <TableHead>Jam</TableHead>
                    <TableHead>Dihapus</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jadwal.map((j) => {
                    const p = j.penugasan;
                    const label = `${HARI_LABEL[j.hari]} ${j.jamMulai}–${j.jamSelesai}`;
                    return (
                      <TableRow key={j.id}>
                        <TableCell className="font-medium text-foreground">{p?.guru?.namaTampil ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {p ? `${p.mapel.namaMapel} / ${p.kelas.namaKelas}` : "—"}
                        </TableCell>
                        <TableCell className="text-foreground">{HARI_LABEL[j.hari]}</TableCell>
                        <TableCell className="text-foreground tabular-nums">{j.jamMulai} – {j.jamSelesai}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{tanggalCell(j.deletedAt)}</TableCell>
                        <TableCell className="text-right space-x-3 whitespace-nowrap">
                          <RestoreButton action={restoreJadwal.bind(null, j.id)} />
                          <PermanentDeleteButton action={permanentDeleteJadwal.bind(null, j.id)} confirmName={label} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}