// Skema validasi & tipe untuk form RPP (PRD §5.1).
import { z } from "zod";

export const PertemuanSchema = z.object({
  id: z.string().optional(), // id existing saat edit (untuk update, bukan input user)
  isiKegiatan: z.string().min(1, "Isi kegiatan pertemuan wajib diisi"),
  tanggal: z.string().optional(), // Tanggal KBM (yyyy-mm-dd), opsional
});

export const RppFormSchema = z.object({
  mapelId: z.string().min(1, "Mata pelajaran wajib dipilih"),
  kelasId: z.string().min(1, "Kelas wajib dipilih"),
  noRpp: z.string().max(50, "No. RPP maksimal 50 karakter").optional(),
  materi: z.string().min(1, "Materi wajib diisi").max(200),
  alokasiWaktu: z.string().min(1, "Alokasi waktu wajib diisi").max(100),
  tujuanPembelajaran: z.string().min(1, "Tujuan pembelajaran wajib diisi"),
  tanggalPengesahan: z.string().min(1, "Tanggal pengesahan wajib diisi"), // ISO date string (yyyy-mm-dd)
  pertemuan: z.array(PertemuanSchema).min(1, "Minimal 1 pertemuan"),
  penilaian: z.object({
    pengetahuan: z.string().min(1, "Penilaian pengetahuan wajib diisi"),
    keterampilan: z.string().min(1, "Penilaian keterampilan wajib diisi"),
    sikap: z.string().min(1, "Penilaian sikap wajib diisi"),
  }),
});

export type RppFormValues = z.infer<typeof RppFormSchema>;
export type RppActionResult = { ok: true; id?: string } | { ok: false; error: string };

// ----- Draft dari AI (subset konten RPP; tanpa mapel/kelas/noRpp/tanggal) -----
export const AiDraftSchema = z.object({
  materi: z.string().min(1, "Materi wajib diisi").max(200),
  alokasiWaktu: z.string().min(1, "Alokasi waktu wajib diisi").max(100),
  tujuanPembelajaran: z.string().min(1, "Tujuan pembelajaran wajib diisi"),
  pertemuan: z.array(z.object({ isiKegiatan: z.string().min(1) })).min(1, "Minimal 1 pertemuan"),
  penilaian: z.object({
    pengetahuan: z.string().min(1, "Penilaian pengetahuan wajib diisi"),
    keterampilan: z.string().min(1, "Penilaian keterampilan wajib diisi"),
    sikap: z.string().min(1, "Penilaian sikap wajib diisi"),
  }),
});

export type AiDraft = z.infer<typeof AiDraftSchema>;