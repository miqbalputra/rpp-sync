// Helper bersama untuk profil Guru (auto-sync saat user berole GURU).
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";

/**
 * Definisi tunggal "User aktif & tidak di-soft-delete" yang dipakai di semua
 * gerbang auth (credentials authorize, Google signIn, jwt enrichment).
 * Email selalu di-normalisasi lowercase sebelum lookup.
 */
export async function findActiveUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email: email.toLowerCase(), deletedAt: null, aktif: true },
    select: { id: true, nama: true, email: true, role: true, gender: true },
  });
}

/**
 * Cocokkan identifier login (username ATAU email). Semua di-lowercase supaya
 * case-insensitive konsisten di SQLite-dev & MariaDB-prod.
 *
 * Pemisahan by "@" (bukan OR): hindari ambiguitas findFirst saat satu nilai
 * bisa cocok sebagai username di satu baris dan email di baris lain —
 * nilai berkarakter "@" selalu ditafsirkan email, sisanya username.
 */
export async function findActiveUserByIdentifier(identifier: string) {
  const value = identifier.trim().toLowerCase();
  const where = value.includes("@")
    ? { email: value }
    : { username: value };
  return prisma.user.findFirst({ where: { deletedAt: null, ...where } });
}

/** Pastikan profil Guru ada & namaTampil tersinkron dengan user.nama (role GURU saja). */
export async function ensureGuruProfile(userId: string, nama: string, role: Role) {
  if (role !== Role.GURU) return;
  const existing = await prisma.guru.findUnique({ where: { userId } });
  if (!existing) {
    await prisma.guru.create({ data: { userId, namaTampil: nama } });
  } else {
    await prisma.guru.update({ where: { userId }, data: { namaTampil: nama } });
  }
}