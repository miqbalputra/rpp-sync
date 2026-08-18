import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getPromesByMapelKelas } from "@/lib/promes/queries";
import { addPromesPageToPdf } from "@/lib/rpp/annotate-pdf";
import { getGuruIdFromSession } from "@/lib/rpp/queries";
import { resolveRppUploadPath } from "@/lib/rpp/upload-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!(await getGuruIdFromSession(session))) {
    return NextResponse.json({ error: "Terlarang" }, { status: 403 });
  }

  const { id } = await params;
  const rpp = await prisma.rpp.findUnique({
    where: { id },
    select: {
      deletedAt: true,
      metodeInput: true,
      mapelId: true,
      kelasId: true,
      mapel: { select: { namaMapel: true } },
      kelas: { select: { namaKelas: true } },
      file: true,
    },
  });
  if (!rpp || rpp.deletedAt || rpp.metodeInput !== "UPLOAD" || !rpp.file) {
    return NextResponse.json({ error: "File RPP tidak ditemukan" }, { status: 404 });
  }

  const absolutePath = resolveRppUploadPath(id, rpp.file.pathFile);
  if (!absolutePath) return NextResponse.json({ error: "Path file tidak valid" }, { status: 500 });

  try {
    const originalFile = await readFile(absolutePath);
    const download = request.nextUrl.searchParams.get("download") === "1";
    const promes = download ? await getPromesByMapelKelas(rpp.mapelId, rpp.kelasId) : null;
    let file = originalFile;
    let fileName = rpp.file.namaFile;

    if (promes) {
      try {
        file = Buffer.from(await addPromesPageToPdf(originalFile, {
          mapelNama: rpp.mapel.namaMapel,
          kelasNama: rpp.kelas.namaKelas,
          promesUrl: promes.url,
        }));
        fileName = `${rpp.file.namaFile.replace(/\.pdf$/i, "")}-dengan-promes.pdf`;
      } catch {
        // File asli tetap dapat diunduh jika PDF lama tidak dapat dimodifikasi.
      }
    }

    const safeName = fileName.replace(/["\\/\r\n]/g, "_");
    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": download ? "application/pdf" : rpp.file.mimeType,
        "Content-Length": String(file.byteLength),
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "File RPP tidak tersedia di penyimpanan" }, { status: 404 });
  }
}
