import { createHash } from "crypto";
import type { Session } from "next-auth";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getErrorCode } from "@/lib/errors";
import { assertGuruPenugasan, getGuruIdFromSession } from "./queries";
import { RppFormSchema, type RppFormValues, type RppSaveResult } from "./schema";

const includeContent = {
  pertemuan: { orderBy: { urutan: "asc" as const } },
  penilaian: true,
} satisfies Prisma.RppInclude;
type StoredRpp = Prisma.RppGetPayload<{ include: typeof includeContent }>;

function contentMatches(rpp: StoredRpp, d: RppFormValues): boolean {
  return rpp.mapelId === d.mapelId && rpp.kelasId === d.kelasId &&
    rpp.noRpp === (d.noRpp?.trim() || null) && rpp.materi === d.materi.trim() &&
    rpp.alokasiWaktu === d.alokasiWaktu.trim() && rpp.tujuanPembelajaran === d.tujuanPembelajaran &&
    rpp.tanggalPengesahan.toISOString().slice(0, 10) === d.tanggalPengesahan &&
    rpp.pertemuan.length === d.pertemuan.length && rpp.pertemuan.every((p, i) =>
      p.isiKegiatan === d.pertemuan[i].isiKegiatan &&
      (p.tanggal?.toISOString().slice(0, 10) ?? "") === (d.pertemuan[i].tanggal ?? "")) &&
    rpp.penilaian?.pengetahuan === d.penilaian.pengetahuan &&
    rpp.penilaian.keterampilan === d.penilaian.keterampilan && rpp.penilaian.sikap === d.penilaian.sikap;
}

function saved(rpp: { id: string; updatedAt: Date }): RppSaveResult {
  return { ok: true, id: rpp.id, updatedAt: rpp.updatedAt.toISOString() };
}

class SaveConflict extends Error {}

export function rppSaveError(error: unknown, operation: string): RppSaveResult {
  const code = getErrorCode(error);
  // Do not log form contents, connection strings, or Prisma's query arguments.
  console.error("[rpp.save]", { operation, code, name: error instanceof Error ? error.name : "UnknownError" });
  if (error instanceof SaveConflict) {
    return { ok: false, code: "CONFLICT", error: "RPP sudah berubah di halaman lain. Isian Anda tetap dicadangkan; buka ulang RPP sebelum menggabungkan perubahan." };
  }
  if (error instanceof Error && error.message === "Mapel/Kelas yang dipilih bukan bagian penugasan Anda") {
    return { ok: false, code: "FORBIDDEN", error: error.message };
  }
  if (code === "P2000") {
    return { ok: false, code: "SAVE_FAILED", error: "Database belum menerima panjang teks ini. Isian tetap dicadangkan. Hubungi admin untuk memperbarui database." };
  }
  return { ok: false, code: "SAVE_FAILED", error: "RPP belum dapat dikonfirmasi tersimpan. Isian tetap dicadangkan. Periksa koneksi lalu coba Simpan lagi." };
}

export async function saveRpp(
  values: RppFormValues,
  session: Session | null,
  options: { ai: boolean; submissionId?: string; id?: string; expectedUpdatedAt?: string },
): Promise<RppSaveResult> {
  if (!session?.user?.id) return { ok: false, code: "SESSION_EXPIRED", error: "Sesi login berakhir. Isian tetap dicadangkan. Masuk kembali lalu lanjutkan formulir ini." };
  if (session.user.role !== "GURU") return { ok: false, code: "FORBIDDEN", error: "Akun ini tidak memiliki akses menyimpan RPP guru." };
  const parsed = RppFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, code: "VALIDATION", error: parsed.error.issues[0].message };
  const d = parsed.data;
  const tanggalPengesahan = new Date(`${d.tanggalPengesahan}T00:00:00.000Z`);
  const dates = d.pertemuan.map((p) => p.tanggal ? new Date(`${p.tanggal}T00:00:00.000Z`) : null);
  if (Number.isNaN(tanggalPengesahan.getTime()) || dates.some((date) => date && Number.isNaN(date.getTime()))) {
    return { ok: false, code: "VALIDATION", error: "Tanggal RPP tidak valid. Periksa tanggal pengesahan dan pertemuan." };
  }

  try {
    const guruId = await getGuruIdFromSession(session);
    if (!guruId) return { ok: false, code: "FORBIDDEN", error: "Profil guru tidak ditemukan. Hubungi admin." };
    const id = options.id ?? (options.submissionId
      ? `rpp_${createHash("sha256").update(`${session.user.id}:${options.submissionId}`).digest("hex").slice(0, 40)}`
      : undefined);

    const existing = id ? await prisma.rpp.findUnique({ where: { id }, include: includeContent }) : null;
    if (existing) {
      if (existing.guruId !== guruId || existing.deletedAt || existing.metodeInput === "UPLOAD") {
        return { ok: false, code: "FORBIDDEN", error: "RPP tidak tersedia untuk disunting." };
      }
      // A retry after a lost response must confirm the original row, not insert a duplicate.
      if (contentMatches(existing, d)) return saved(existing);
      if (!options.id) {
        return { ok: false, code: "CONFLICT", id: existing.id, error: "RPP dari formulir ini sudah tersimpan dengan isi berbeda. Buka RPP tersimpan untuk menggabungkan perubahan. Cadangan isian ini tetap tersedia." };
      }
    } else if (options.id) {
      return { ok: false, code: "FORBIDDEN", error: "RPP tidak ditemukan. Cadangan isian tetap tersedia." };
    }
    await assertGuruPenugasan(guruId, d.mapelId, d.kelasId);

    const data = {
      mapelId: d.mapelId, kelasId: d.kelasId, noRpp: d.noRpp?.trim() || null,
      materi: d.materi.trim(), alokasiWaktu: d.alokasiWaktu.trim(),
      tujuanPembelajaran: d.tujuanPembelajaran, tanggalPengesahan,
    };
    const pertemuan = d.pertemuan.map((p, i) => ({ urutan: i + 1, isiKegiatan: p.isiKegiatan, tanggal: dates[i] }));

    if (options.id) {
      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.rpp.updateMany({
          where: { id: options.id, guruId, deletedAt: null, ...(options.expectedUpdatedAt ? { updatedAt: new Date(options.expectedUpdatedAt) } : {}) },
          data: { ...data, updatedAt: new Date(Math.max(Date.now(), (existing?.updatedAt.getTime() ?? 0) + 1)) },
        });
        if (result.count !== 1) throw new SaveConflict();
        await tx.rppPertemuan.deleteMany({ where: { rppId: options.id } });
        await tx.rppPertemuan.createMany({ data: pertemuan.map((p) => ({ ...p, rppId: options.id! })) });
        await tx.rppPenilaian.upsert({
          where: { rppId: options.id }, create: { rppId: options.id!, ...d.penilaian }, update: d.penilaian,
        });
        await tx.rppExport.deleteMany({ where: { rppId: options.id } });
        return tx.rpp.findUniqueOrThrow({ where: { id: options.id } });
      });
      return saved(updated);
    }

    try {
      // Prisma nested writes commit the RPP, meetings, and assessment atomically.
      const created = await prisma.rpp.create({ data: {
        ...data, ...(id ? { id } : {}), guruId, status: "DRAFT", dibuatOleh: session.user.id,
        dibuatDenganAI: options.ai, metodeInput: options.ai ? "AI" : "MANUAL",
        pertemuan: { create: pertemuan }, penilaian: { create: d.penilaian },
      } });
      return saved(created);
    } catch (error) {
      // Two identical requests may race; the primary key still permits only one row.
      if (id && getErrorCode(error) === "P2002") {
        const duplicate = await prisma.rpp.findUnique({ where: { id }, include: includeContent });
        if (duplicate && duplicate.guruId === guruId && !duplicate.deletedAt && contentMatches(duplicate, d)) return saved(duplicate);
      }
      throw error;
    }
  } catch (error) {
    return rppSaveError(error, options.id ? "update" : "create");
  }
}
