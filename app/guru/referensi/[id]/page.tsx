// Detail referensi RPP (read-only) + tombol duplikat.
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGuruIdFromSession, getNamaKepalaSekolah } from "@/lib/rpp/queries";
import { RppView, RppViewData } from "@/components/rpp/RppView";
import { duplicateRpp } from "../actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Copy } from "lucide-react";

export const metadata = { title: "Referensi RPP — Guru" };

export default async function ReferensiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const guruId = await getGuruIdFromSession(session);

  const rpp = await prisma.rpp.findUnique({
    where: { id },
    include: {
      mapel: true,
      kelas: true,
      pertemuan: { orderBy: { urutan: "asc" } },
      penilaian: true,
      guru: true,
    },
  });

  if (!rpp || rpp.deletedAt) notFound();

  // Akses hanya jika: bukan milik sendiri & guru punya penugasan (mapel,kelas) sama
  const allowed =
    guruId &&
    rpp.guruId !== guruId &&
    (await prisma.penugasan.findFirst({
      where: { guruId, mapelId: rpp.mapelId, kelasId: rpp.kelasId },
    })) !== null;

  if (!allowed) notFound();

  const namaKepalaSekolah = await getNamaKepalaSekolah();
  const data: RppViewData = {
    noRpp: rpp.noRpp,
    materi: rpp.materi,
    alokasiWaktu: rpp.alokasiWaktu,
    tujuanPembelajaran: rpp.tujuanPembelajaran,
    tanggalPengesahan: rpp.tanggalPengesahan,
    mapelNama: rpp.mapel.namaMapel,
    kelasNama: rpp.kelas.namaKelas,
    kelasGender: rpp.kelas.gender,
    semester: rpp.kelas.semester,
    tahunAjaran: rpp.kelas.tahunAjaran,
    namaUstadz: rpp.guru?.namaTampil ?? "",
    namaKepalaSekolah,
    tempat: "Purbalingga",
    pertemuan: rpp.pertemuan.map((p) => ({ urutan: p.urutan, isiKegiatan: p.isiKegiatan })),
    penilaian: rpp.penilaian
      ? { pengetahuan: rpp.penilaian.pengetahuan, keterampilan: rpp.penilaian.keterampilan, sikap: rpp.penilaian.sikap }
      : null,
  };

  return (
    <div className="max-w-3xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <Link href="/guru/referensi" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Referensi
        </Link>
        <div className="text-xs text-muted-foreground">
          RPP milik {rpp.guru?.namaTampil ?? "—"} (read-only)
        </div>
      </div>
      <Card className="p-6">
        <RppView data={data} />
      </Card>
      <div className="mt-4 flex justify-end">
        <form action={duplicateRpp.bind(null, rpp.id) as unknown as (fd: FormData) => Promise<void>}>
          <button type="submit" className={cn(buttonVariants({ variant: "default" }))}>
            <Copy className="h-4 w-4" /> Duplikat sebagai Draft
          </button>
        </form>
      </div>
    </div>
  );
}