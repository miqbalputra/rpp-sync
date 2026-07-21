// Skema validasi Jadwal + konstanta hari.
import { z } from "zod";

export const HARI = [
  "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "AHAD",
] as const;
export type Hari = (typeof HARI)[number];

export const HARI_LABEL: Record<Hari, string> = {
  SENIN: "Senin",
  SELASA: "Selasa",
  RABU: "Rabu",
  KAMIS: "Kamis",
  JUMAT: "Jumat",
  SABTU: "Sabtu",
  AHAD: "Ahad",
};

// Urutan kronologis dalam seminggu (dipakai untuk sorting list jadwal).
export const HARI_ORDER: Record<Hari, number> = {
  SENIN: 1,
  SELASA: 2,
  RABU: 3,
  KAMIS: 4,
  JUMAT: 5,
  SABTU: 6,
  AHAD: 7,
};

const HH_MM = /^\d{2}:\d{2}$/;

export const JadwalFormSchema = z
  .object({
    penugasanId: z.string().min(1, "Penugasan wajib dipilih"),
    hari: z.enum(HARI, { message: "Hari tidak valid" }),
    jamMulai: z.string().regex(HH_MM, "Format jam mulai HH:mm"),
    jamSelesai: z.string().regex(HH_MM, "Format jam selesai HH:mm"),
  })
  .refine((d) => d.jamSelesai > d.jamMulai, {
    message: "Jam selesai harus setelah jam mulai",
    path: ["jamSelesai"],
  });

export type JadwalFormValues = z.infer<typeof JadwalFormSchema>;