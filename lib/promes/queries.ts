import { prisma } from "@/lib/db";

export type PromesWithRefs = {
  id: string;
  mapelId: string;
  kelasId: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  mapel: { id: string; namaMapel: string };
  kelas: { id: string; namaKelas: string; gender: "IKHWAN" | "AKHWAT"; semester: string; tahunAjaran: string };
};

export async function getPromesByMapelKelas(mapelId: string, kelasId: string) {
  return prisma.promes.findFirst({
    where: {
      mapelId,
      kelasId,
      deletedAt: null,
      mapel: { deletedAt: null },
      kelas: { deletedAt: null },
    },
    include: { mapel: true, kelas: true },
  });
}

export async function listActivePromes(): Promise<PromesWithRefs[]> {
  return prisma.promes.findMany({
    where: {
      deletedAt: null,
      mapel: { deletedAt: null },
      kelas: { deletedAt: null },
    },
    orderBy: [{ kelas: { namaKelas: "asc" } }, { mapel: { namaMapel: "asc" } }],
    include: {
      mapel: { select: { id: true, namaMapel: true } },
      kelas: { select: { id: true, namaKelas: true, gender: true, semester: true, tahunAjaran: true } },
    },
  });
}

export async function getPromesFormOptions() {
  const [mapel, kelas] = await Promise.all([
    prisma.mapel.findMany({ where: { deletedAt: null }, orderBy: { namaMapel: "asc" }, select: { id: true, namaMapel: true } }),
    prisma.kelas.findMany({ where: { deletedAt: null }, orderBy: [{ namaKelas: "asc" }, { gender: "asc" }], select: { id: true, namaKelas: true, gender: true, semester: true, tahunAjaran: true } }),
  ]);
  return { mapel, kelas };
}

export async function getPromesForGuru(guruId: string) {
  const assignments = await prisma.penugasan.findMany({
    where: {
      guruId,
      deletedAt: null,
      mapel: { deletedAt: null },
      kelas: { deletedAt: null },
    },
    include: {
      mapel: { select: { id: true, namaMapel: true } },
      kelas: { select: { id: true, namaKelas: true, gender: true, semester: true, tahunAjaran: true } },
    },
  });

  const uniqueAssignments = new Map<string, (typeof assignments)[number]>();
  for (const assignment of assignments) {
    uniqueAssignments.set(`${assignment.mapelId}:${assignment.kelasId}`, assignment);
  }

  const pairs = Array.from(uniqueAssignments.values());
  if (pairs.length === 0) return [];

  const promes = await prisma.promes.findMany({
    where: {
      OR: pairs.map((pair) => ({ mapelId: pair.mapelId, kelasId: pair.kelasId })),
      deletedAt: null,
      mapel: { deletedAt: null },
      kelas: { deletedAt: null },
    },
    select: { mapelId: true, kelasId: true, url: true, updatedAt: true },
  });
  const promesByPair = new Map(promes.map((item) => [`${item.mapelId}:${item.kelasId}`, item]));

  return pairs
    .map((pair) => ({
      mapelId: pair.mapelId,
      kelasId: pair.kelasId,
      mapelNama: pair.mapel.namaMapel,
      kelasNama: pair.kelas.namaKelas,
      kelasGender: pair.kelas.gender,
      semester: pair.kelas.semester,
      tahunAjaran: pair.kelas.tahunAjaran,
      promes: promesByPair.get(`${pair.mapelId}:${pair.kelasId}`) ?? null,
    }))
    .sort((a, b) => a.kelasNama.localeCompare(b.kelasNama, "id") || a.mapelNama.localeCompare(b.mapelNama, "id"));
}
