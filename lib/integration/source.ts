import { prisma } from "@/lib/db";

type Cursor = { updatedAt: string; id: string; entity: "promes" | "rpp" };

function date(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

function decodeCursor(value: string | null): Cursor | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Cursor;
    return parsed.updatedAt && parsed.id && (parsed.entity === "rpp" || parsed.entity === "promes") ? parsed : null;
  } catch {
    return null;
  }
}

function encodeCursor(value: Cursor): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function serializeRpp(rpp: {
  id: string; noRpp: string | null; materi: string; alokasiWaktu: string; tujuanPembelajaran: string;
  status: string; tanggalPengesahan: Date; dibuatDenganAI: boolean; metodeInput: string;
  createdAt: Date; updatedAt: Date; deletedAt: Date | null;
  guru: { id: string; namaTampil: string; user: { username: string; email: string | null } };
  mapel: { id: string; namaMapel: string }; kelas: { id: string; namaKelas: string; semester: string; tahunAjaran: string };
  pertemuan: { urutan: number; isiKegiatan: string; tanggal: Date | null }[];
  penilaian: { pengetahuan: string; keterampilan: string; sikap: string } | null;
  file: { id: string; namaFile: string; mimeType: string; ukuranByte: number; createdAt: Date } | null;
}) {
  return {
    id: rpp.id, noRpp: rpp.noRpp, materi: rpp.materi, alokasiWaktu: rpp.alokasiWaktu,
    tujuanPembelajaran: rpp.tujuanPembelajaran, status: rpp.status,
    tanggalPengesahan: date(rpp.tanggalPengesahan), dibuatDenganAI: rpp.dibuatDenganAI,
    metodeInput: rpp.metodeInput, createdAt: date(rpp.createdAt), updatedAt: date(rpp.updatedAt), deletedAt: date(rpp.deletedAt),
    guru: rpp.guru, mapel: rpp.mapel, kelas: rpp.kelas,
    pertemuan: rpp.pertemuan.map((item) => ({ ...item, tanggal: date(item.tanggal) })),
    penilaian: rpp.penilaian, file: rpp.file ? { ...rpp.file, createdAt: date(rpp.file.createdAt) } : null,
  };
}

export function serializePromes(promes: {
  id: string; url: string; createdAt: Date; updatedAt: Date; deletedAt: Date | null;
  mapel: { id: string; namaMapel: string }; kelas: { id: string; namaKelas: string; semester: string; tahunAjaran: string };
}) {
  return { id: promes.id, url: promes.url, createdAt: date(promes.createdAt), updatedAt: date(promes.updatedAt), deletedAt: date(promes.deletedAt), mapel: promes.mapel, kelas: promes.kelas };
}

const rppInclude = {
  guru: { include: { user: { select: { username: true, email: true } } } },
  mapel: true, kelas: true,
  pertemuan: { orderBy: { urutan: "asc" as const } }, penilaian: true, file: true,
};

const promesInclude = { mapel: true, kelas: true };

export async function integrationRpp(id: string) {
  const rpp = await prisma.rpp.findUnique({ where: { id }, include: rppInclude });
  return rpp ? serializeRpp(rpp) : null;
}

export async function integrationPromes(id: string) {
  const promes = await prisma.promes.findUnique({ where: { id }, include: promesInclude });
  return promes ? serializePromes(promes) : null;
}

export async function integrationChanges(rawCursor: string | null, rawLimit: string | null) {
  const cursor = decodeCursor(rawCursor);
  if (rawCursor && !cursor) throw new Error("Cursor tidak valid");
  const limit = Math.min(Math.max(Number(rawLimit) || 50, 1), 100);
  const changedAfter = cursor ? new Date(cursor.updatedAt) : null;
  const where = changedAfter ? { OR: [{ updatedAt: { gt: changedAfter } }, { updatedAt: changedAfter, id: { gt: cursor!.id } }] } : {};
  const [rpps, promes] = await Promise.all([
    prisma.rpp.findMany({ where, select: { id: true, updatedAt: true, deletedAt: true }, orderBy: [{ updatedAt: "asc" }, { id: "asc" }], take: limit + 1 }),
    prisma.promes.findMany({ where, select: { id: true, updatedAt: true, deletedAt: true }, orderBy: [{ updatedAt: "asc" }, { id: "asc" }], take: limit + 1 }),
  ]);
  const entries = [
    ...rpps.map((item) => ({ entity: "rpp" as const, id: item.id, updatedAt: item.updatedAt, deletedAt: item.deletedAt })),
    ...promes.map((item) => ({ entity: "promes" as const, id: item.id, updatedAt: item.updatedAt, deletedAt: item.deletedAt })),
  ].sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime() || a.id.localeCompare(b.id) || a.entity.localeCompare(b.entity));
  const page = entries.slice(0, limit);
  const tail = page.at(-1);
  return {
    changes: page.map((item) => ({ ...item, updatedAt: date(item.updatedAt), deletedAt: date(item.deletedAt) })),
    nextCursor: tail ? encodeCursor({ updatedAt: tail.updatedAt.toISOString(), id: tail.id, entity: tail.entity }) : rawCursor,
    hasMore: entries.length > limit,
  };
}
