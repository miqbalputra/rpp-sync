// Server actions CRUD Penugasan (guru -> mapel -> kelas).
"use server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const PenugasanSchema = z.object({
  guruId: z.string().min(1, "Guru wajib dipilih"),
  mapelId: z.string().min(1, "Mapel wajib dipilih"),
  kelasId: z.string().min(1, "Kelas wajib dipilih"),
});

export async function createPenugasan(formData: FormData) {
  await requireAdmin();
  const parsed = PenugasanSchema.safeParse({
    guruId: formData.get("guruId"),
    mapelId: formData.get("mapelId"),
    kelasId: formData.get("kelasId"),
  });
  if (!parsed.success) {
    redirect(`/admin/penugasan/baru?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }
  try {
    await prisma.penugasan.create({ data: parsed.data });
  } catch (e: any) {
    if (e?.code === "P2002") {
      redirect(`/admin/penugasan/baru?error=${encodeURIComponent("Penugasan ini sudah ada (guru + mapel + kelas yang sama)")}`);
    }
    throw e;
  }
  revalidatePath("/admin/penugasan");
  redirect("/admin/penugasan");
}

export async function deletePenugasan(id: string) {
  await requireAdmin();
  await prisma.penugasan.delete({ where: { id } });
  revalidatePath("/admin/penugasan");
  redirect("/admin/penugasan");
}