// Helper query & RBAC kepemilikan untuk RPP.
import { prisma } from "@/lib/db";
import { Session } from "next-auth";
import { Role } from "@prisma/client";

/** Ambil guru profile dari session (guruId). */
export async function getGuruIdFromSession(session: Session | null): Promise<string | null> {
  if (!session?.user?.id || session.user.role !== Role.GURU) return null;
  const guru = await prisma.guru.findUnique({ where: { userId: session.user.id } });
  return guru?.id ?? null;
}

/** Opsi dropdown Mapel & Kelas dari Penugasan guru. */
export async function getOpsiFormGuru(guruId: string) {
  const penugasan = await prisma.penugasan.findMany({
    where: { guruId },
    include: { mapel: true, kelas: true },
  });
  // Mapel unik
  const mapelMap = new Map<string, string>();
  penugasan.forEach((p) => mapelMap.set(p.mapel.id, p.mapel.namaMapel));
  const mapelOptions = Array.from(mapelMap, ([id, namaMapel]) => ({ id, namaMapel }));

  // Kelas per mapel (guru bisa ajar mapel berbeda di kelas berbeda)
  const kelasByMapel = new Map<string, { id: string; namaKelas: string; gender: string }[]>();
  penugasan.forEach((p) => {
    const arr = kelasByMapel.get(p.mapelId) ?? [];
    arr.push({ id: p.kelas.id, namaKelas: p.kelas.namaKelas, gender: p.kelas.gender });
    kelasByMapel.set(p.mapelId, arr);
  });

  return { mapelOptions, kelasByMapel };
}

/** Nama Kepala Sekolah aktif (untuk auto-fill pengesahan). */
export async function getNamaKepalaSekolah(): Promise<string | null> {
  const k = await prisma.user.findFirst({
    where: { role: Role.KEPALA_SEKOLAH, aktif: true },
    orderBy: { nama: "asc" },
  });
  return k?.nama ?? null;
}

/** Verifikasi kepemilikan RPP oleh guru (throw jika bukan miliknya). */
export async function assertOwnsRpp(rppId: string, guruId: string) {
  const rpp = await prisma.rpp.findUnique({ where: { id: rppId }, select: { guruId: true, deletedAt: true } });
  if (!rpp) throw new Error("NOT_FOUND");
  if (rpp.guruId !== guruId) throw new Error("FORBIDDEN");
  return rpp;
}

/** Load RPP lengkap untuk form edit (hanya pemilik). */
export async function loadRppForEdit(rppId: string, guruId: string) {
  const rpp = await prisma.rpp.findUnique({
    where: { id: rppId },
    include: { pertemuan: { orderBy: { urutan: "asc" } }, penilaian: true, mapel: true, kelas: true },
  });
  if (!rpp || rpp.deletedAt) throw new Error("NOT_FOUND");
  if (rpp.guruId !== guruId) throw new Error("FORBIDDEN");
  return rpp;
}