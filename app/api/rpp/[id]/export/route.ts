// Endpoint download export RPP (gambar/PDF) — PRD Tahap 7. Hanya pemilik RPP.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getGuruIdFromSession, getNamaKepalaSekolah } from "@/lib/rpp/queries";
import { getOrCreateExport, ExportTipe } from "@/lib/rpp/export";
import { readFile } from "fs/promises";

export const runtime = "nodejs";
// Export butuh Puppeteer (Chromium) — dynamic.
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tipeParam = req.nextUrl.searchParams.get("tipe") ?? "pdf";
  const tipe: ExportTipe =
    tipeParam === "image" ? "IMAGE" : tipeParam === "word" ? "DOCX" : "PDF";

  const session = await auth();
  const guruId = await getGuruIdFromSession(session);

  // Ambil RPP + validasi kepemilikan (guru) — PRD §4.1.
  const rpp = await prisma.rpp.findUnique({
    where: { id },
    include: { mapel: true, kelas: true, pertemuan: { orderBy: { urutan: "asc" } }, penilaian: true, guru: true },
  });
  if (!rpp || rpp.deletedAt) {
    return NextResponse.json({ error: "RPP tidak ditemukan" }, { status: 404 });
  }
  if (!guruId || rpp.guruId !== guruId) {
    return NextResponse.json({ error: "Terlarang" }, { status: 403 });
  }

  const namaKepalaSekolah = await getNamaKepalaSekolah();
  const data = {
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

  const { absPath, mime, relPath } = await getOrCreateExport(rpp.id, data, tipe);
  const buf = await readFile(absPath);

  const ext = tipe === "IMAGE" ? "png" : tipe === "DOCX" ? "docx" : "pdf";
  const safeMateri = rpp.materi.replace(/[^a-zA-Z0-9-_ ]/g, "").slice(0, 40).trim() || "rpp";
  const filename = `RPP-${safeMateri}.${ext}`;

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}