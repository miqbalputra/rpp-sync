// Server actions CRUD Kelas.
"use server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const KelasSchema = z.object({
  namaKelas: z.string().min(1, "Nama kelas wajib diisi").max(50),
  semester: z.string().min(1, "Semester wajib diisi").max(20),
  gender: z.enum(["IKHWAN", "AKHWAT"], { message: "Gender wajib dipilih" }),
  tahunAjaran: z.string().min(1, "Tahun ajaran wajib diisi").max(20),
});

export async function createKelas(formData: FormData) {
  await requireAdmin();
  const parsed = KelasSchema.safeParse({
    namaKelas: formData.get("namaKelas"),
    semester: formData.get("semester"),
    gender: formData.get("gender"),
    tahunAjaran: formData.get("tahunAjaran"),
  });
  if (!parsed.success) {
    redirect(`/admin/kelas/baru?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }
  await prisma.kelas.create({ data: parsed.data });
  revalidatePath("/admin/kelas");
  redirect("/admin/kelas");
}

export async function updateKelas(id: string, formData: FormData) {
  await requireAdmin();
  const parsed = KelasSchema.safeParse({
    namaKelas: formData.get("namaKelas"),
    semester: formData.get("semester"),
    gender: formData.get("gender"),
    tahunAjaran: formData.get("tahunAjaran"),
  });
  if (!parsed.success) {
    redirect(`/admin/kelas/${id}/edit?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }
  await prisma.kelas.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/kelas");
  redirect("/admin/kelas");
}

export async function deleteKelas(id: string) {
  await requireAdmin();
  try {
    await prisma.kelas.delete({ where: { id } });
  } catch (e: any) {
    redirect(`/admin/kelas?error=${encodeURIComponent("Kelas tidak bisa dihapus karena masih dipakai penugasan atau RPP.")}`);
  }
  revalidatePath("/admin/kelas");
  revalidatePath("/admin");
  redirect("/admin/kelas");
}