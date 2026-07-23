// Server action duplikat RPP sebagai draft (PRD §5.3).
"use server";
import { prisma } from "@/lib/db";
import { requireGuru } from "@/lib/auth-guard";
import { getGuruIdFromSession } from "@/lib/rpp/queries";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function duplicateRpp(sourceId: string) {
  const session = await requireGuru();
  const guruId = await getGuruIdFromSession(session);
  if (!guruId) redirect("/guru/referensi?error=" + encodeURIComponent("Profil guru tidak ditemukan"));

  // Load sumber + validasi: guru login harus punya penugasan untuk (mapel,kelas) sumber,
  // dan sumber bukan miliknya sendiri.
  const src = await prisma.rpp.findUnique({
    where: { id: sourceId, deletedAt: null },
    include: { pertemuan: { orderBy: { urutan: "asc" } }, penilaian: true },
  });
  if (!src) redirect("/guru/referensi?error=" + encodeURIComponent("RPP sumber tidak ditemukan"));
  if (src.guruId === guruId) redirect("/guru/referensi?error=" + encodeURIComponent("Tidak bisa menduplikat RPP sendiri"));

  const hasPenugasan = await prisma.penugasan.findFirst({
    where: {
      guruId,
      mapelId: src.mapelId,
      kelasId: src.kelasId,
      deletedAt: null,
      mapel: { deletedAt: null },
      kelas: { deletedAt: null },
    },
  });
  if (!hasPenugasan) {
    redirect("/guru/referensi?error=" + encodeURIComponent("Anda tidak mengampu mapel+kelas yang sama"));
  }

  const today = new Date();
  const newRpp = await prisma.$transaction(async (tx) => {
    return tx.rpp.create({
      data: {
        guruId,
        mapelId: src.mapelId,
        kelasId: src.kelasId,
        materi: src.materi,
        alokasiWaktu: src.alokasiWaktu,
        tujuanPembelajaran: src.tujuanPembelajaran,
        status: "DRAFT",
        tanggalPengesahan: today,
        dibuatOleh: session.user.id,
        pertemuan: {
          create: src.pertemuan.map((p, i) => ({
            urutan: i + 1,
            isiKegiatan: p.isiKegiatan,
            tanggal: p.tanggal,
          })),
        },
        penilaian: src.penilaian
          ? {
              create: {
                pengetahuan: src.penilaian.pengetahuan,
                keterampilan: src.penilaian.keterampilan,
                sikap: src.penilaian.sikap,
              },
            }
          : undefined,
      },
    });
  });

  revalidatePath("/guru/rpp");
  revalidatePath("/guru");
  redirect(`/guru/rpp/${newRpp.id}/edit?dup=1`);
}