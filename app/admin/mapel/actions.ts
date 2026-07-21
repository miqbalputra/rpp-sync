// Server actions CRUD Mapel.
"use server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const MapelSchema = z.object({
  namaMapel: z.string().min(1, "Nama mapel wajib diisi").max(100),
});

export async function createMapel(formData: FormData) {
  await requireAdmin();
  const parsed = MapelSchema.safeParse({ namaMapel: formData.get("namaMapel") });
  if (!parsed.success) {
    redirect(`/admin/mapel/baru?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }
  try {
    await prisma.mapel.create({ data: { namaMapel: parsed.data.namaMapel.trim() } });
  } catch (e: any) {
    if (e?.code === "P2002") {
      redirect(`/admin/mapel/baru?error=${encodeURIComponent("Nama mapel sudah ada")}`);
    }
    throw e;
  }
  revalidatePath("/admin/mapel");
  redirect("/admin/mapel");
}

export async function updateMapel(id: string, formData: FormData) {
  await requireAdmin();
  const parsed = MapelSchema.safeParse({ namaMapel: formData.get("namaMapel") });
  if (!parsed.success) {
    redirect(`/admin/mapel/${id}/edit?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }
  try {
    await prisma.mapel.update({ where: { id }, data: { namaMapel: parsed.data.namaMapel.trim() } });
  } catch (e: any) {
    if (e?.code === "P2002") {
      redirect(`/admin/mapel/${id}/edit?error=${encodeURIComponent("Nama mapel sudah ada")}`);
    }
    throw e;
  }
  revalidatePath("/admin/mapel");
  redirect("/admin/mapel");
}

export async function deleteMapel(id: string) {
  await requireAdmin();
  // Hindari hapus mapel yang masih dipakai penugasan/RPP (onDelete: Restrict).
  try {
    await prisma.mapel.delete({ where: { id } });
  } catch (e: any) {
    // Jika dipakai, beri pesan via redirect.
    redirect(`/admin/mapel?error=${encodeURIComponent("Mapel tidak bisa dihapus karena masih dipakai penugasan atau RPP.")}`);
  }
  revalidatePath("/admin/mapel");
  revalidatePath("/admin");
  redirect("/admin/mapel");
}