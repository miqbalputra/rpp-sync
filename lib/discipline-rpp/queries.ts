import { prisma } from "@/lib/db";

export type DisciplineStatus = "LENGKAP" | "BELUM_LENGKAP" | "TANPA_PENUGASAN";

export type MissingRppAssignment = {
  mapel: string;
  kelas: string;
  gender: "IKHWAN" | "AKHWAT";
};

export type RppDisciplineEntry = {
  guruId: string;
  namaGuru: string;
  rank: number | null;
  totalPenugasan: number;
  rppSudahDibuat: number;
  rppBelumDibuat: number;
  persentase: number | null;
  status: DisciplineStatus;
  missing: MissingRppAssignment[];
};

export type RppDisciplineReport = {
  generatedAt: Date;
  summary: {
    totalGuru: number;
    guruDinilai: number;
    guruLengkap: number;
    guruBelumLengkap: number;
    guruTanpaPenugasan: number;
    totalPenugasan: number;
    penugasanSudahPunyaRpp: number;
    penugasanBelumPunyaRpp: number;
  };
  leaderboard: RppDisciplineEntry[];
  entries: RppDisciplineEntry[];
};

function pairKey(guruId: string, mapelId: string, kelasId: string) {
  return `${guruId}:${mapelId}:${kelasId}`;
}

/**
 * Mengukur kedisiplinan dari cakupan RPP terhadap penugasan aktif, bukan dari
 * jumlah RPP mentah. Satu atau lebih RPP pada pasangan tugas yang sama tetap
 * dihitung sebagai satu kewajiban yang sudah terpenuhi.
 */
export async function getRppDisciplineReport(): Promise<RppDisciplineReport> {
  const [gurus, penugasan, rpps] = await Promise.all([
    prisma.guru.findMany({
      where: { deletedAt: null, user: { deletedAt: null, aktif: true } },
      select: { id: true, namaTampil: true },
      orderBy: { namaTampil: "asc" },
    }),
    prisma.penugasan.findMany({
      where: {
        deletedAt: null,
        guru: { deletedAt: null, user: { deletedAt: null, aktif: true } },
        mapel: { deletedAt: null },
        kelas: { deletedAt: null },
      },
      select: {
        guruId: true,
        mapelId: true,
        kelasId: true,
        mapel: { select: { namaMapel: true } },
        kelas: { select: { namaKelas: true, gender: true } },
      },
    }),
    prisma.rpp.findMany({
      where: { deletedAt: null },
      select: { guruId: true, mapelId: true, kelasId: true },
    }),
  ]);

  const rppByPenugasan = new Set(rpps.map((rpp) => pairKey(rpp.guruId, rpp.mapelId, rpp.kelasId)));
  const penugasanByGuru = new Map<string, typeof penugasan>();
  for (const item of penugasan) {
    const list = penugasanByGuru.get(item.guruId) ?? [];
    list.push(item);
    penugasanByGuru.set(item.guruId, list);
  }

  const entries = gurus.map<RppDisciplineEntry>((guru) => {
    const tugas = penugasanByGuru.get(guru.id) ?? [];
    const missing = tugas
      .filter((item) => !rppByPenugasan.has(pairKey(item.guruId, item.mapelId, item.kelasId)))
      .map((item) => ({
        mapel: item.mapel.namaMapel,
        kelas: item.kelas.namaKelas,
        gender: item.kelas.gender,
      }));
    const totalPenugasan = tugas.length;
    const rppBelumDibuat = missing.length;
    const rppSudahDibuat = totalPenugasan - rppBelumDibuat;
    const persentase = totalPenugasan > 0 ? Math.round((rppSudahDibuat / totalPenugasan) * 100) : null;
    const status: DisciplineStatus = totalPenugasan === 0
      ? "TANPA_PENUGASAN"
      : rppBelumDibuat === 0
        ? "LENGKAP"
        : "BELUM_LENGKAP";

    return {
      guruId: guru.id,
      namaGuru: guru.namaTampil,
      rank: null,
      totalPenugasan,
      rppSudahDibuat,
      rppBelumDibuat,
      persentase,
      status,
      missing,
    };
  });

  const leaderboard = entries
    .filter((entry) => entry.totalPenugasan > 0)
    .sort((a, b) => {
      const score = (b.persentase ?? 0) - (a.persentase ?? 0);
      if (score !== 0) return score;
      const covered = b.rppSudahDibuat - a.rppSudahDibuat;
      if (covered !== 0) return covered;
      return a.namaGuru.localeCompare(b.namaGuru, "id");
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
  const rankedByGuruId = new Map(leaderboard.map((entry) => [entry.guruId, entry.rank]));
  const orderedEntries = entries
    .map((entry) => ({ ...entry, rank: rankedByGuruId.get(entry.guruId) ?? null }))
    .sort((a, b) => {
      if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
      if (a.rank !== null) return -1;
      if (b.rank !== null) return 1;
      return a.namaGuru.localeCompare(b.namaGuru, "id");
    });

  const guruDinilai = leaderboard.length;
  const guruLengkap = leaderboard.filter((entry) => entry.status === "LENGKAP").length;
  const guruBelumLengkap = leaderboard.filter((entry) => entry.status === "BELUM_LENGKAP").length;
  const totalPenugasan = penugasan.length;
  const penugasanBelumPunyaRpp = orderedEntries.reduce((sum, entry) => sum + entry.rppBelumDibuat, 0);

  return {
    generatedAt: new Date(),
    summary: {
      totalGuru: gurus.length,
      guruDinilai,
      guruLengkap,
      guruBelumLengkap,
      guruTanpaPenugasan: gurus.length - guruDinilai,
      totalPenugasan,
      penugasanSudahPunyaRpp: totalPenugasan - penugasanBelumPunyaRpp,
      penugasanBelumPunyaRpp,
    },
    leaderboard,
    entries: orderedEntries,
  };
}
