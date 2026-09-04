// Server actions Recycle Bin (Admin): restore & hapus permanen untuk SEMUA entitas.
// Semua hapus (di seluruh app) bersifat soft-delete → masuk Sampah. Dari Sampah,
// admin bisa memulihkan atau menghapus permanen (dengan konfirmasi ketat ketik-nama).
"use server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { rm } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { removeRppUpload } from "@/lib/rpp/upload-storage";
import { getErrorCode } from "@/lib/errors";
import { notifySchool } from "@/lib/integration/webhook";

const EXPORT_DIR = join(process.cwd(), "public", "exports");

async function revalidateTrash() {
  revalidatePath("/admin/recycle-bin");
  revalidatePath("/admin");
  revalidatePath("/jadwal");
  revalidatePath("/guru");
}

// ----- RPP -----
export async function restoreRpp(id: string) {
  await requireAdmin();
  await prisma.rpp.update({ where: { id }, data: { deletedAt: null } });
  await notifySchool("rpp.upsert", id);
  await revalidateTrash();
  redirect("/admin/recycle-bin");
}

export async function permanentDeleteRpp(id: string) {
  await requireAdmin();
  // Hapus file export cache (jika ada) lalu hapus record RPP + relasi (cascade).
  const exports = await prisma.rppExport.findMany({ where: { rppId: id }, select: { pathFile: true } });
  const uploadedFile = await prisma.rppFile.findUnique({ where: { rppId: id }, select: { pathFile: true } });
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
  if (uploadedFile) await removeRppUpload(id, uploadedFile.pathFile).catch(() => undefined);
  // Cascade: pertemuan, penilaian, logStatus, exports terhapus otomatis (onDelete: Cascade)
  await prisma.rpp.delete({ where: { id } });
  await revalidateTrash();
  redirect("/admin/recycle-bin");
}

// ----- User (+ profil Guru turut dipulihkan) -----
export async function restoreUser(id: string) {
  await requireAdmin();
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { deletedAt: null } }),
    prisma.guru.updateMany({ where: { userId: id }, data: { deletedAt: null } }),
  ]);
  await revalidateTrash();
  redirect("/admin/recycle-bin");
}

export async function permanentDeleteUser(id: string) {
  await requireAdmin();
  // Hard-delete user → cascade hapus Guru/Penugasan/Jadwal/RPP miliknya.
  // Diblok P2003 bila user masih terkait RPP (dibuatOleh) atau log status —
  // kondisi itu harus diselesaikan dulu (tidak bisa hapus permanen).
  try {
    await prisma.user.delete({ where: { id } });
  } catch (e: unknown) {
    if (getErrorCode(e) === "P2003" || getErrorCode(e) === "P2014") {
      redirect(`/admin/recycle-bin?error=${encodeURIComponent("User masih terkait RPP/log — tidak bisa dihapus permanen.")}`);
    }
    throw e;
  }
  await revalidateTrash();
  redirect("/admin/recycle-bin");
}

// ----- Mapel -----
export async function restoreMapel(id: string) {
  await requireAdmin();
  await prisma.mapel.update({ where: { id }, data: { deletedAt: null } });
  await revalidateTrash();
  redirect("/admin/recycle-bin");
}

export async function permanentDeleteMapel(id: string) {
  await requireAdmin();
  // onDelete: Restrict dari Rpp & Penugasan → diblok bila masih dipakai.
  try {
    await prisma.mapel.delete({ where: { id } });
  } catch (e: unknown) {
    if (getErrorCode(e) === "P2003" || getErrorCode(e) === "P2014") {
      redirect(`/admin/recycle-bin?error=${encodeURIComponent("Mapel masih dipakai RPP/penugasan — tidak bisa dihapus permanen.")}`);
    }
    throw e;
  }
  await revalidateTrash();
  redirect("/admin/recycle-bin");
}

// ----- Kelas -----
export async function restoreKelas(id: string) {
  await requireAdmin();
  await prisma.kelas.update({ where: { id }, data: { deletedAt: null } });
  await revalidateTrash();
  redirect("/admin/recycle-bin");
}

export async function permanentDeleteKelas(id: string) {
  await requireAdmin();
  try {
    await prisma.kelas.delete({ where: { id } });
  } catch (e: unknown) {
    if (getErrorCode(e) === "P2003" || getErrorCode(e) === "P2014") {
      redirect(`/admin/recycle-bin?error=${encodeURIComponent("Kelas masih dipakai RPP/penugasan — tidak bisa dihapus permanen.")}`);
    }
    throw e;
  }
  await revalidateTrash();
  redirect("/admin/recycle-bin");
}

// ----- Penugasan -----
export async function restorePenugasan(id: string) {
  await requireAdmin();
  await prisma.penugasan.update({ where: { id }, data: { deletedAt: null } });
  await revalidateTrash();
  redirect("/admin/recycle-bin");
}

export async function permanentDeletePenugasan(id: string) {
  await requireAdmin();
  // Cascade: jadwal terkait terhapus otomatis (onDelete: Cascade).
  await prisma.penugasan.delete({ where: { id } });
  await revalidateTrash();
  redirect("/admin/recycle-bin");
}

// ----- Jadwal -----
export async function restoreJadwal(id: string) {
  await requireAdmin();
  await prisma.jadwal.update({ where: { id }, data: { deletedAt: null } });
  await revalidateTrash();
  redirect("/admin/recycle-bin");
}

export async function permanentDeleteJadwal(id: string) {
  await requireAdmin();
  await prisma.jadwal.delete({ where: { id } });
  await revalidateTrash();
  redirect("/admin/recycle-bin");
}
