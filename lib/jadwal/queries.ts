// Query Jadwal + komputasi pengingat overdue RPP (on-demand).
import { prisma } from "@/lib/db";
import { Hari, HARI_ORDER } from "@/lib/jadwal/schema";

// JS Date.getDay(): 0=Min,1=Sen,...,6=Sab. Map ke Hari (Seminggu Senin..Ahad).
const DAY_TO_HARI: Hari[] = [
  "AHAD", // 0 Sunday
  "SENIN", // 1 Monday
  "SELASA", // 2
  "RABU", // 3
  "KAMIS", // 4
  "JUMAT", // 5
  "SABTU", // 6 Saturday
];

export async function listJadwalForAdmin() {
  const rows = await prisma.jadwal.findMany({
    include: {
      penugasan: {
        include: {
          guru: { include: { user: { select: { nama: true, gender: true } } } },
          mapel: true,
          kelas: true,
        },
      },
    },
  });
  // Sort kronologis: hari (Senin..Ahad) lalu jamMulai. orderBy DB pada enum
  // hanya urut alfabetis (AHAD, JUMAT, …) — tidak sesuai urutan minggu.
  return rows.sort((a, b) => {
    const dh = HARI_ORDER[a.hari] - HARI_ORDER[b.hari];
    if (dh !== 0) return dh;
    return a.jamMulai.localeCompare(b.jamMulai);
  });
}

export async function listJadwalForGuru(guruId: string) {
  const rows = await prisma.jadwal.findMany({
    where: { penugasan: { guruId } },
    include: {
      penugasan: {
        include: { mapel: true, kelas: true },
      },
    },
  });
  return rows.sort((a, b) => {
    const dh = HARI_ORDER[a.hari] - HARI_ORDER[b.hari];
    if (dh !== 0) return dh;
    return a.jamMulai.localeCompare(b.jamMulai);
  });
}

/** Opsi Penugasan untuk form jadwal: label "guru -> mapel -> kelas". */
export async function getOpsiPenugasanForJadwal() {
  const rows = await prisma.penugasan.findMany({
    include: {
      guru: { include: { user: { select: { nama: true } } } },
      mapel: true,
      kelas: true,
    },
    orderBy: [{ guru: { namaTampil: "asc" } }, { mapel: { namaMapel: "asc" } }],
  });
  return rows.map((p) => ({
    id: p.id,
    label: `${p.guru.namaTampil} → ${p.mapel.namaMapel} → ${p.kelas.namaKelas}`,
  }));
}

/**
 * Tree Penugasan untuk form Jadwal yang ber-cascade (guru → mapel → kelas).
 * Tiap node membawa id + nama ketiga entitas; klien menyaring bertingkat dan
 * menyimpulkan `penugasanId` dari pilihan guru+mapel+kelas.
 */
export type PenugasanTreeNode = {
  id: string; // penugasanId
  guruId: string;
  guruNama: string;
  guruGender: string | null;
  mapelId: string;
  mapelNama: string;
  kelasId: string;
  kelasNama: string;
  kelasGender: string;
};

export async function getPenugasanTreeForJadwal(): Promise<PenugasanTreeNode[]> {
  const rows = await prisma.penugasan.findMany({
    include: {
      guru: { include: { user: { select: { gender: true } } } },
      mapel: true,
      kelas: true,
    },
    orderBy: [
      { guru: { namaTampil: "asc" } },
      { mapel: { namaMapel: "asc" } },
      { kelas: { namaKelas: "asc" } },
    ],
  });
  return rows.map((p) => ({
    id: p.id,
    guruId: p.guruId,
    guruNama: p.guru.namaTampil,
    guruGender: p.guru.user.gender,
    mapelId: p.mapelId,
    mapelNama: p.mapel.namaMapel,
    kelasId: p.kelasId,
    kelasNama: p.kelas.namaKelas,
    kelasGender: p.kelas.gender,
  }));
}

export type OverdueAlert = {
  jadwalId: string;
  hari: Hari;
  jamMulai: string;
  jamSelesai: string;
  mapel: string;
  kelas: string;
  penugasanId: string;
};

/**
 * Pengingat RPP yang belum dibuat: untuk jadwal hari ini yang jamMulai-nya sudah lewat,
 * cek apakah guru sudah punya RPP (deletedAt null) untuk mapel+kelas tsb.
 * On-demand — tidak di-persist.
 */
export async function getOverdueAlertsForGuru(
  guruId: string,
  now: Date = new Date(),
): Promise<OverdueAlert[]> {
  const todayHari = DAY_TO_HARI[now.getDay()];
  const todayStr = now.toTimeString().slice(0, 5); // "HH:mm" lokal

  const jadwals = await prisma.jadwal.findMany({
    where: { penugasan: { guruId }, hari: todayHari },
    include: { penugasan: { include: { mapel: true, kelas: true } } },
  });

  const due = jadwals.filter((j) => j.jamMulai <= todayStr);
  if (due.length === 0) return [];

  // Batch: ambil semua RPP guru (deletedAt null), index by mapel_kelas.
  const rpps = await prisma.rpp.findMany({
    where: { guruId, deletedAt: null },
    select: { mapelId: true, kelasId: true },
  });
  const hasRpp = new Set(rpps.map((r) => `${r.mapelId}_${r.kelasId}`));

  const alerts: OverdueAlert[] = [];
  for (const j of due) {
    const key = `${j.penugasan.mapelId}_${j.penugasan.kelasId}`;
    if (!hasRpp.has(key)) {
      alerts.push({
        jadwalId: j.id,
        hari: j.hari,
        jamMulai: j.jamMulai,
        jamSelesai: j.jamSelesai,
        mapel: j.penugasan.mapel.namaMapel,
        kelas: j.penugasan.kelas.namaKelas,
        penugasanId: j.penugasanId,
      });
    }
  }
  return alerts;
}