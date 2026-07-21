// Server actions Recycle Bin (Admin): restore & hapus permanen.
"use server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { rm } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const EXPORT_DIR = join(process.cwd(), "public", "exports");

export async function restoreRpp(id: string) {
  await requireAdmin();
  await prisma.rpp.update({ where: { id }, data: { deletedAt: null } });
  revalidatePath("/admin/recycle-bin");
  revalidatePath("/admin");
  redirect("/admin/recycle-bin");
}

export async function permanentDeleteRpp(id: string) {
  await requireAdmin();
  // Hapus file export cache (jika ada) lalu hapus record RPP + relasi (cascade).
  const exports = await prisma.rppExport.findMany({ where: { rppId: id }, select: { pathFile: true } });
  for (const ex of exports) {
    const abs = join(process.cwd(), ex.pathFile);
    if (existsSync(abs)) {
      try { await rm(abs, { force: true }); } catch {}
    }
  }
  // Hapus folder export per-rpp bila ada
  const rppDir = join(EXPORT_DIR, id);
  if (existsSync(rppDir)) {
    try { await rm(rppDir, { recursive: true, force: true }); } catch {}
  }
  // Cascade: pertemuan, penilaian, logStatus, exports terhapus otomatis (onDelete: Cascade)
  await prisma.rpp.delete({ where: { id } });
  revalidatePath("/admin/recycle-bin");
  revalidatePath("/admin");
  redirect("/admin/recycle-bin");
}