// Server actions CRUD RPP milik guru.
"use server";
import { prisma } from "@/lib/db";
import { requireGuru } from "@/lib/auth-guard";
import { getGuruIdFromSession, assertOwnsRpp, getNamaKepalaSekolah } from "@/lib/rpp/queries";
import { RppFormSchema, RppFormValues, RppActionResult, AiDraft } from "@/lib/rpp/schema";
import { getOrCreateExport, ExportTipe } from "@/lib/rpp/export";
import { revalidatePath } from "next/cache";
import { getAiConfig } from "@/lib/ai/client";
import { generateRppFromImage } from "@/lib/ai/generate-rpp";

/** Pastikan mapel+kelas terpilih adalah milik penugasan guru. */
async function validatePenugasan(guruId: string, mapelId: string, kelasId: string) {
  const t = await prisma.penugasan.findFirst({
    where: { guruId, mapelId, kelasId },
  });
  if (!t) throw new Error("Mapel/Kelas yang dipilih bukan bagian penugasan Anda");
}

/** Helper simpan RPP baru. Dipakai createRpp (manual) & createRppAi (AI). */
async function persistRpp(
  values: RppFormValues,
  session: Awaited<ReturnType<typeof requireGuru>>,
  opts: { ai: boolean }
): Promise<RppActionResult> {
  try {
    const guruId = await getGuruIdFromSession(session);
    if (!guruId) return { ok: false, error: "Profil guru tidak ditemukan" };

    const parsed = RppFormSchema.safeParse(values);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0].message };
    }
    const d = parsed.data;
    await validatePenugasan(guruId, d.mapelId, d.kelasId);

    const tanggalPengesahan = new Date(d.tanggalPengesahan + "T00:00:00");

    await prisma.$transaction(async (tx) => {
      const rpp = await tx.rpp.create({
        data: {
          guruId,
          mapelId: d.mapelId,
          kelasId: d.kelasId,
          noRpp: d.noRpp?.trim() || null,
          materi: d.materi.trim(),
          alokasiWaktu: d.alokasiWaktu.trim(),
          tujuanPembelajaran: d.tujuanPembelajaran,
          status: "DRAFT",
          tanggalPengesahan,
          dibuatOleh: session.user.id,
          dibuatDenganAI: opts.ai,
          pertemuan: {
            create: d.pertemuan.map((p, i) => ({
              urutan: i + 1,
              isiKegiatan: p.isiKegiatan,
            })),
          },
          penilaian: {
            create: {
              pengetahuan: d.penilaian.pengetahuan,
              keterampilan: d.penilaian.keterampilan,
              sikap: d.penilaian.sikap,
            },
          },
        },
      });
      return rpp;
    });

    revalidatePath("/guru/rpp");
    revalidatePath("/guru");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Gagal menyimpan RPP" };
  }
}

export async function createRpp(values: RppFormValues): Promise<RppActionResult> {
  const session = await requireGuru();
  return persistRpp(values, session, { ai: false });
}

/** Simpan RPP yang dibuat lewat flow AI (flag dibuatDenganAI = true). */
export async function createRppAi(values: RppFormValues): Promise<RppActionResult> {
  const session = await requireGuru();
  return persistRpp(values, session, { ai: true });
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
  const session = await requireGuru();
  try {
    const guruId = await getGuruIdFromSession(session);
    if (!guruId) return { ok: false, error: "Profil guru tidak ditemukan" };

    await assertOwnsRpp(id, guruId); // throw jika bukan miliknya

    const parsed = RppFormSchema.safeParse(values);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0].message };
    }
    const d = parsed.data;
    await validatePenugasan(guruId, d.mapelId, d.kelasId);

    const tanggalPengesahan = new Date(d.tanggalPengesahan + "T00:00:00");

    await prisma.$transaction(async (tx) => {
      await tx.rpp.update({
        where: { id },
        data: {
          mapelId: d.mapelId,
          kelasId: d.kelasId,
          noRpp: d.noRpp?.trim() || null,
          materi: d.materi.trim(),
          alokasiWaktu: d.alokasiWaktu.trim(),
          tujuanPembelajaran: d.tujuanPembelajaran,
          tanggalPengesahan,
        },
      });

      // Replace pertemuan (hapus semua, insert ulang dengan urutan baru)
      await tx.rppPertemuan.deleteMany({ where: { rppId: id } });
      await tx.rppPertemuan.createMany({
        data: d.pertemuan.map((p, i) => ({
          rppId: id,
          urutan: i + 1,
          isiKegiatan: p.isiKegiatan,
        })),
      });

      // Upsert penilaian
      await tx.rppPenilaian.upsert({
        where: { rppId: id },
        create: {
          rppId: id,
          pengetahuan: d.penilaian.pengetahuan,
          keterampilan: d.penilaian.keterampilan,
          sikap: d.penilaian.sikap,
        },
        update: {
          pengetahuan: d.penilaian.pengetahuan,
          keterampilan: d.penilaian.keterampilan,
          sikap: d.penilaian.sikap,
        },
      });

      // Invalidate cache export (akan di-regenerate saat diminta)
      await tx.rppExport.deleteMany({ where: { rppId: id } });
    });

    revalidatePath("/guru/rpp");
    revalidatePath(`/guru/rpp/${id}`);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Gagal menyimpan RPP" };
  }
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
    revalidatePath("/guru/rpp");
    revalidatePath("/guru");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Gagal menghapus RPP" };
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

    const namaKepalaSekolah = await getNamaKepalaSekolah();
    const data = {
      noRpp: rpp.noRpp,
      dibuatDenganAI: rpp.dibuatDenganAI,
      materi: rpp.materi, alokasiWaktu: rpp.alokasiWaktu, tujuanPembelajaran: rpp.tujuanPembelajaran,
      tanggalPengesahan: rpp.tanggalPengesahan, mapelNama: rpp.mapel.namaMapel, kelasNama: rpp.kelas.namaKelas,
      kelasGender: rpp.kelas.gender, semester: rpp.kelas.semester, tahunAjaran: rpp.kelas.tahunAjaran,
      namaUstadz: rpp.guru?.namaTampil ?? session.user?.name ?? "", namaKepalaSekolah, tempat: "Purbalingga",
      pertemuan: rpp.pertemuan.map((p) => ({ urutan: p.urutan, isiKegiatan: p.isiKegiatan })),
      penilaian: rpp.penilaian ? { pengetahuan: rpp.penilaian.pengetahuan, keterampilan: rpp.penilaian.keterampilan, sikap: rpp.penilaian.sikap } : null,
    };

    const tipe: ExportTipe = tipeParam === "image" ? "IMAGE" : tipeParam === "word" ? "DOCX" : "PDF";
    const { relPath } = await getOrCreateExport(rppId, data, tipe);

    const base = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const fileUrl = `${base}${relPath}`;
    const pesan = `Assalamu'alaikum,\nRPP "${rpp.materi}"\nMapel: ${rpp.mapel.namaMapel} | Kelas: ${rpp.kelas.namaKelas}\nOleh: ${data.namaUstadz}\n\nUnduh dokumen RPP:\n${fileUrl}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(pesan)}`;
    return { url: waUrl };
  } catch (e: any) {
    return { error: e?.message ?? "Gagal menyiapkan link share" };
  }
}
