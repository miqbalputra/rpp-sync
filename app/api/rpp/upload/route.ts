import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getGuruIdFromSession, assertGuruPenugasan } from "@/lib/rpp/queries";
import { RppUploadMetadataSchema } from "@/lib/rpp/schema";
import { getOriginalPdfName, getPdfTitle, isPdfBytes, removeRppUpload, writeRppUpload } from "@/lib/rpp/upload-storage";
import { RPP_UPLOAD_MAX_BYTES } from "@/lib/rpp/upload-constants";
import { revalidatePath } from "next/cache";
import { notifySchool } from "@/lib/integration/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const guruId = await getGuruIdFromSession(session);
  if (!guruId) return errorResponse("Profil Guru tidak ditemukan atau Anda tidak berwenang", 403);

  const formData = await request.formData();
  if (String(formData.get("confirmation") ?? "") !== "1") {
    return errorResponse("Konfirmasi format RPP wajib disetujui terlebih dahulu");
  }
  const metadata = RppUploadMetadataSchema.safeParse({
    mapelId: String(formData.get("mapelId") ?? ""),
    kelasId: String(formData.get("kelasId") ?? ""),
    noRpp: String(formData.get("noRpp") ?? "").trim() || undefined,
    tanggalPengesahan: String(formData.get("tanggalPengesahan") ?? ""),
  });
  if (!metadata.success) return errorResponse(metadata.error.issues[0]?.message ?? "Metadata RPP tidak valid");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return errorResponse("File RPP PDF wajib diunggah");
  if (file.size > RPP_UPLOAD_MAX_BYTES) return errorResponse("Ukuran file PDF maksimal 10 MB");
  if (file.type && file.type !== "application/pdf") return errorResponse("Format file harus PDF");

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!isPdfBytes(bytes)) return errorResponse("File yang diunggah bukan PDF yang valid");

  try {
    await assertGuruPenugasan(guruId, metadata.data.mapelId, metadata.data.kelasId);
    const tanggalPengesahan = new Date(`${metadata.data.tanggalPengesahan}T00:00:00`);
    if (Number.isNaN(tanggalPengesahan.getTime())) return errorResponse("Tanggal pengesahan tidak valid");

    const rppId = randomUUID();
    const originalName = getOriginalPdfName(file.name);
    const title = getPdfTitle(originalName);
    const stored = await writeRppUpload(rppId, bytes);

    try {
      await prisma.rpp.create({
        data: {
          id: rppId,
          guruId,
          mapelId: metadata.data.mapelId,
          kelasId: metadata.data.kelasId,
          noRpp: metadata.data.noRpp?.trim() || null,
          materi: title,
          alokasiWaktu: "—",
          tujuanPembelajaran: "",
          status: "DRAFT",
          tanggalPengesahan,
          dibuatOleh: session?.user?.id ?? "",
          dibuatDenganAI: false,
          metodeInput: "UPLOAD",
          file: {
            create: {
              id: randomUUID(),
              namaFile: originalName,
              pathFile: stored.relativePath,
              mimeType: "application/pdf",
              ukuranByte: bytes.byteLength,
            },
          },
        },
      });
    } catch (error) {
      await removeRppUpload(rppId, stored.relativePath).catch(() => undefined);
      throw error;
    }

    revalidatePath("/guru/rpp");
    revalidatePath("/guru/referensi");
    revalidatePath("/guru");
    await notifySchool("rpp.upsert", rppId);
    return NextResponse.json({ id: rppId }, { status: 201 });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Gagal menyimpan RPP PDF", 500);
  }
}
