// Server actions CRUD RPP milik guru.
"use server";
import { prisma } from "@/lib/db";
import { requireGuru } from "@/lib/auth-guard";
import { auth } from "@/lib/auth";
import { saveRpp, rppSaveError } from "@/lib/rpp/save";
import { completeRppSave } from "@/lib/rpp/save-effects";
import { getGuruIdFromSession, assertOwnsRpp, getNamaKepalaSekolah } from "@/lib/rpp/queries";
import { RppFormValues, RppActionResult, AiDraft } from "@/lib/rpp/schema";
import { getOrCreateExport, ExportTipe } from "@/lib/rpp/export";
import { revalidatePath } from "next/cache";
import { getAiConfig } from "@/lib/ai/client";
import { generateRppFromImage } from "@/lib/ai/generate-rpp";
import { notifySchool } from "@/lib/integration/webhook";

function getActionErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/** Legacy Server Actions remain available to already-open clients. */
export async function createRpp(values: RppFormValues): Promise<RppActionResult> {
  try {
    const result = await saveRpp(values, await auth(), { ai: false });
    if (result.ok) completeRppSave(result.id);
    return result;
  } catch (error) { return rppSaveError(error, "legacy-create"); }
}

export async function createRppAi(values: RppFormValues): Promise<RppActionResult> {
  try {
    if (!(await getAiConfig())) return { ok: false, error: "Fitur AI belum diaktifkan atau belum dikonfigurasi Admin." };
    const result = await saveRpp(values, await auth(), { ai: true });
    if (result.ok) completeRppSave(result.id);
    return result;
  } catch (error) { return rppSaveError(error, "legacy-create-ai"); }
}

type GenerateOutcome = { ok: true; draft: AiDraft } | { ok: false; error: string };

/** Generate draft RPP dari foto materi via AI. Tidak persist — kembalikan draft. */
export async function generateRppDraft(formData: FormData): Promise<GenerateOutcome> {
  await requireGuru();

  const cfg = await getAiConfig();
  if (!cfg || !cfg.enabled) {
    return { ok: false, error: "Fitur AI belum diaktifkan Admin." };
  }

  const file = formData.get("foto");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Foto materi wajib diunggah." };
  }
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    return { ok: false, error: "Format foto harus JPG/PNG/WebP." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "Ukuran foto maksimal 5MB." };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const res = await generateRppFromImage(buf, file.type);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, draft: res.draft };
}

export async function updateRpp(id: string, values: RppFormValues): Promise<RppActionResult> {
  try {
    const result = await saveRpp(values, await auth(), { ai: false, id });
    if (result.ok) completeRppSave(result.id);
    return result;
  } catch (error) { return rppSaveError(error, "legacy-update"); }
}

export async function softDeleteRpp(id: string): Promise<RppActionResult> {
  const session = await requireGuru();
  try {
    const guruId = await getGuruIdFromSession(session);
    if (!guruId) return { ok: false, error: "Profil guru tidak ditemukan" };
    await assertOwnsRpp(id, guruId);
    await prisma.rpp.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await notifySchool("rpp.deleted", id);
    revalidatePath("/guru/rpp");
    revalidatePath("/guru");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: getActionErrorMessage(e, "Gagal menghapus RPP") };
  }
}
/** Siapkan link WhatsApp share (PRD Tahap 9). Generate export bila perlu, kembalikan URL wa.me. */
export async function getShareUrl(rppId: string, tipeParam: "image" | "pdf" | "word"): Promise<{ url: string } | { error: string }> {
  const session = await requireGuru();
  try {
    const guruId = await getGuruIdFromSession(session);
    if (!guruId) return { error: "Profil guru tidak ditemukan" };
    await assertOwnsRpp(rppId, guruId);

    const rpp = await prisma.rpp.findUnique({
      where: { id: rppId },
      include: { mapel: true, kelas: true, pertemuan: { orderBy: { urutan: "asc" } }, penilaian: true, guru: true },
    });
    if (!rpp) return { error: "RPP tidak ditemukan" };
    if (rpp.metodeInput === "UPLOAD") return { error: "RPP PDF tidak memiliki export terstruktur" };

    const namaKepalaSekolah = await getNamaKepalaSekolah();
    const data = {
      noRpp: rpp.noRpp,
      dibuatDenganAI: rpp.dibuatDenganAI,
      materi: rpp.materi, alokasiWaktu: rpp.alokasiWaktu, tujuanPembelajaran: rpp.tujuanPembelajaran,
      tanggalPengesahan: rpp.tanggalPengesahan, mapelNama: rpp.mapel.namaMapel, kelasNama: rpp.kelas.namaKelas,
      kelasGender: rpp.kelas.gender, semester: rpp.kelas.semester, tahunAjaran: rpp.kelas.tahunAjaran,
      namaUstadz: rpp.guru?.namaTampil ?? session.user?.name ?? "", namaKepalaSekolah, tempat: "Purbalingga",
      pertemuan: rpp.pertemuan.map((p) => ({ urutan: p.urutan, isiKegiatan: p.isiKegiatan, tanggal: p.tanggal })),
      penilaian: rpp.penilaian ? { pengetahuan: rpp.penilaian.pengetahuan, keterampilan: rpp.penilaian.keterampilan, sikap: rpp.penilaian.sikap } : null,
    };

    const tipe: ExportTipe = tipeParam === "image" ? "IMAGE" : tipeParam === "word" ? "DOCX" : "PDF";
    const { relPath } = await getOrCreateExport(rppId, data, tipe);

    const base = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const fileUrl = `${base}${relPath}`;
    const pesan = `Assalamu'alaikum,\nRPP "${rpp.materi}"\nMapel: ${rpp.mapel.namaMapel} | Kelas: ${rpp.kelas.namaKelas}\nOleh: ${data.namaUstadz}\n\nUnduh dokumen RPP:\n${fileUrl}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(pesan)}`;
    return { url: waUrl };
  } catch (e: unknown) {
    return { error: getActionErrorMessage(e, "Gagal menyiapkan link share") };
  }
}
