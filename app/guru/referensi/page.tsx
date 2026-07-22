// Referensi: RPP guru lain dengan mapel+kelas sama (PRD §5.3).
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGuruIdFromSession } from "@/lib/rpp/queries";
import { duplicateRpp } from "./actions";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Copy, Eye } from "lucide-react";
import { AiBadge } from "@/components/rpp/AiBadge";

export const metadata = { title: "Referensi — Guru" };

export default async function ReferensiPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await auth();
  const guruId = await getGuruIdFromSession(session);

  const penugasan = guruId
    ? await prisma.penugasan.findMany({ where: { guruId }, select: { mapelId: true, kelasId: true } })
    : [];

  const orClauses = penugasan.map((t) => ({ mapelId: t.mapelId, kelasId: t.kelasId }));

  const rppList =
    guruId && orClauses.length > 0
      ? await prisma.rpp.findMany({
          where: { AND: [{ guruId: { not: guruId } }, { deletedAt: null }, { OR: orClauses }] },
          orderBy: { updatedAt: "desc" },
          include: { mapel: true, kelas: true, guru: { select: { namaTampil: true } } },
        })
      : [];

  return (
    <div>
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Referensi RPP</h1>
        <p className="text-sm text-muted-foreground">
          RPP guru lain dengan mapel &amp; kelas yang sama dengan Anda (read-only)
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400">
          {decodeURIComponent(error)}
        </div>
      )}

      {!guruId ? (
        <Card className="p-8 text-center text-muted-foreground">Profil Guru tidak ditemukan.</Card>
      ) : penugasan.length === 0 ? (
        <Card className="p-12 text-center border-dashed text-muted-foreground">
          Anda belum memiliki penugasan. Hubungi Admin/PJ Kurikulum.
        </Card>
      ) : rppList.length === 0 ? (
        <Card className="p-12 text-center border-dashed text-muted-foreground">
          Belum ada RPP dari guru lain yang cocok dengan mapel &amp; kelas Anda.
        </Card>
      ) : (
        <div className="space-y-3">
          {rppList.map((r) => (
            <Card key={r.id} className="p-4 transition-shadow hover:shadow-md">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs text-muted-foreground">{r.mapel.namaMapel} · {r.kelas.namaKelas}</span>
                <span className="text-xs text-muted-foreground">oleh {r.guru?.namaTampil ?? "—"}</span>
                {r.noRpp && <span className="text-xs font-mono text-foreground">No. {r.noRpp}</span>}
                {r.dibuatDenganAI && <AiBadge />}
              </div>
              <div className="font-semibold text-foreground">{r.materi}</div>
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.tujuanPembelajaran}</div>
              <div className="flex items-center gap-4 mt-3 text-sm">
                <Link href={`/guru/referensi/${r.id}`} className="inline-flex items-center gap-1 text-primary font-medium hover:underline">
                  <Eye className="h-4 w-4" /> Lihat
                </Link>
                <form action={duplicateRpp.bind(null, r.id) as unknown as (fd: FormData) => Promise<void>}>
                  <button type="submit" className="inline-flex items-center gap-1 text-blue-700 font-medium hover:underline">
                    <Copy className="h-4 w-4" /> Duplikat sebagai Draft
                  </button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}