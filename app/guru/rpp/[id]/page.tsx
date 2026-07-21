// Halaman detail RPP milik guru (Tahap 4: lihat + edit). Tombol export/share di Tahap 7-9.
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGuruIdFromSession, getNamaKepalaSekolah, assertOwnsRpp } from "@/lib/rpp/queries";
import { RppView, RppViewData } from "@/components/rpp/RppView";
import ShareButton from "../ShareButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Image as ImageIcon, FileText, FileType2, Pencil } from "lucide-react";

export const metadata = { title: "Detail RPP — Guru" };

export default async function RppDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const guruId = await getGuruIdFromSession(session);

  try {
    if (guruId) await assertOwnsRpp(id, guruId);
  } catch {
    notFound();
  }

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
  if (!rpp || (guruId && rpp.guruId !== guruId)) notFound();

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
    namaUstadz: rpp.guru?.namaTampil ?? session?.user?.name ?? "",
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
        <Link href="/guru/rpp" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Kembali ke RPP Saya
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <a href={`/api/rpp/${id}/export?tipe=image`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))} title="Unduh sebagai gambar PNG">
            <ImageIcon className="h-4 w-4" /> Gambar
          </a>
          <a href={`/api/rpp/${id}/export?tipe=pdf`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))} title="Unduh sebagai PDF">
            <FileText className="h-4 w-4" /> PDF
          </a>
          <a href={`/api/rpp/${id}/export?tipe=word`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))} title="Unduh sebagai Word (.docx)">
            <FileType2 className="h-4 w-4" /> Word
          </a>
          <Link href={`/guru/rpp/${id}/edit`} className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
            <Pencil className="h-4 w-4" /> Edit RPP
          </Link>
        </div>
      </div>
      <Card className="p-6">
        <RppView data={data} />
      </Card>

      <div className="mt-4 flex flex-wrap items-center gap-3 justify-between">
        <div className="text-sm text-muted-foreground">Bagikan dokumen RPP ini:</div>
        <ShareButton rppId={id} />
      </div>
    </div>
  );
}