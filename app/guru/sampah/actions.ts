// Server actions Sampah Guru: pulihkan & hapus permanen RPP milik sendiri.
// Guru hanya bisa mengelola RPP-nya sendiri yang sudah masuk Sampah.
// Hapus permanen tetap memakai konfirmasi ketat (ketik nama materi) di UI.
"use server";
import { prisma } from "@/lib/db";
import { requireGuru } from "@/lib/auth-guard";
import { getGuruIdFromSession, assertOwnsRpp } from "@/lib/rpp/queries";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { rm } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const EXPORT_DIR = join(process.cwd(), "public", "exports");

/** Pulihkan RPP milik sendiri dari Sampah. */
export async function restoreRpp(id: string) {
  const session = await requireGuru();
  const guruId = await getGuruIdFromSession(session);
  if (!guruId) redirect("/guru/sampah?error=" + encodeURIComponent("Profil guru tidak ditemukan"));
  const rpp = await assertOwnsRpp(id, guruId); // pastikan milik sendiri
  if (!rpp.deletedAt) redirect("/guru/sampah"); // bukan di Sampah → tidak ada yang dipulihkan
  await prisma.rpp.update({ where: { id }, data: { deletedAt: null } });
  revalidatePath("/guru/sampah");
  revalidatePath("/guru/rpp");
  revalidatePath("/guru");
  redirect("/guru/sampah");
}

/** Hapus permanen RPP milik sendiri (file export + record + relasi cascade). */
export async function permanentDeleteRpp(id: string) {
  const session = await requireGuru();
  const guruId = await getGuruIdFromSession(session);
  if (!guruId) redirect("/guru/sampah?error=" + encodeURIComponent("Profil guru tidak ditemukan"));
  const rpp = await assertOwnsRpp(id, guruId);
  // Hanya RPP yang sudah di Sampah yang boleh dihapus permanen.
  if (!rpp.deletedAt) redirect("/guru/sampah?error=" + encodeURIComponent("RPP ini tidak ada di Sampah."));

  const exports = await prisma.rppExport.findMany({ where: { rppId: id }, select: { pathFile: true } });
  for (const ex of exports) {
    const abs = join(process.cwd(), ex.pathFile);
    if (existsSync(abs)) {
      try { await rm(abs, { force: true }); } catch {}
    }
  }
  const rppDir = join(EXPORT_DIR, id);
  if (existsSync(rppDir)) {
    try { await rm(rppDir, { recursive: true, force: true }); } catch {}
  }
  // Cascade: pertemuan, penilaian, logStatus, exports terhapus otomatis.
  await prisma.rpp.delete({ where: { id } });
  revalidatePath("/guru/sampah");
  revalidatePath("/guru/rpp");
  revalidatePath("/guru");
  redirect("/guru/sampah");
}