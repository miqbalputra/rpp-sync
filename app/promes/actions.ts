"use server";

import { prisma } from "@/lib/db";
import { requireAdminOrPj } from "@/lib/auth-guard";
import { PromesSchema } from "@/lib/promes/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifySchool } from "@/lib/integration/webhook";

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

async function assertActivePair(mapelId: string, kelasId: string) {
  const [mapel, kelas] = await Promise.all([
    prisma.mapel.findFirst({ where: { id: mapelId, deletedAt: null }, select: { id: true } }),
    prisma.kelas.findFirst({ where: { id: kelasId, deletedAt: null }, select: { id: true } }),
  ]);
  if (!mapel) throw new Error("Mapel tidak ditemukan atau sudah dihapus");
  if (!kelas) throw new Error("Kelas tidak ditemukan atau sudah dihapus");
}

function revalidatePromesViews() {
  revalidatePath("/promes");
  revalidatePath("/guru/promes");
  revalidatePath("/guru");
  revalidatePath("/guru/rpp");
  revalidatePath("/guru/referensi");
}

export async function createPromes(formData: FormData) {
  await requireAdminOrPj();
  const parsed = PromesSchema.safeParse({
    mapelId: String(formData.get("mapelId") ?? ""),
    kelasId: String(formData.get("kelasId") ?? ""),
    url: String(formData.get("url") ?? ""),
  });
  if (!parsed.success) {
    redirect(`/promes/baru?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Data Promes tidak valid")}`);
  }

  try {
    await assertActivePair(parsed.data.mapelId, parsed.data.kelasId);
    const existing = await prisma.promes.findUnique({ where: { mapelId_kelasId: { mapelId: parsed.data.mapelId, kelasId: parsed.data.kelasId } } });
    const promes = existing
      ? await prisma.promes.update({ where: { id: existing.id }, data: { ...parsed.data, deletedAt: null } })
      : await prisma.promes.create({ data: parsed.data });
    await notifySchool("promes.upsert", promes.id);
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      redirect(`/promes/baru?error=${encodeURIComponent("Pasangan Mapel dan Kelas ini sudah memiliki Promes")}`);
    }
    redirect(`/promes/baru?error=${encodeURIComponent(error instanceof Error ? error.message : "Gagal menyimpan Promes")}`);
  }

  revalidatePromesViews();
  redirect("/promes");
}

export async function updatePromes(id: string, formData: FormData) {
  await requireAdminOrPj();
  const parsed = PromesSchema.safeParse({
    mapelId: String(formData.get("mapelId") ?? ""),
    kelasId: String(formData.get("kelasId") ?? ""),
    url: String(formData.get("url") ?? ""),
  });
  if (!parsed.success) {
    redirect(`/promes/${id}/edit?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Data Promes tidak valid")}`);
  }

  try {
    await assertActivePair(parsed.data.mapelId, parsed.data.kelasId);
    await prisma.promes.update({ where: { id }, data: parsed.data });
    await notifySchool("promes.upsert", id);
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      redirect(`/promes/${id}/edit?error=${encodeURIComponent("Pasangan Mapel dan Kelas ini sudah memiliki Promes")}`);
    }
    redirect(`/promes/${id}/edit?error=${encodeURIComponent(error instanceof Error ? error.message : "Gagal memperbarui Promes")}`);
  }

  revalidatePromesViews();
  redirect("/promes");
}

export async function deletePromes(id: string) {
  await requireAdminOrPj();
  await prisma.promes.update({ where: { id }, data: { deletedAt: new Date() } });
  await notifySchool("promes.deleted", id);
  revalidatePromesViews();
  redirect("/promes");
}
