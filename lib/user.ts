// Helper bersama untuk profil Guru (auto-sync saat user berole GURU).
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";

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