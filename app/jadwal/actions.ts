// Server actions Jadwal mengajar (Admin & PJ Diniyyah).
"use server";
import { prisma } from "@/lib/db";
import { requireAdminOrPj } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { JadwalFormSchema } from "@/lib/jadwal/schema";

export async function createJadwal(formData: FormData) {
  await requireAdminOrPj();
  const parsed = JadwalFormSchema.safeParse({
    penugasanId: formData.get("penugasanId"),
    hari: formData.get("hari"),
    jamMulai: formData.get("jamMulai"),
    jamSelesai: formData.get("jamSelesai"),
  });
  if (!parsed.success) {
    redirect(`/jadwal/baru?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }
  const d = parsed.data;
  try {
    await prisma.jadwal.create({
      data: {
        penugasanId: d.penugasanId,
        hari: d.hari,
        jamMulai: d.jamMulai,
        jamSelesai: d.jamSelesai,
      },
    });
  } catch (e: any) {
    if (e?.code === "P2002") {
      redirect(`/jadwal/baru?error=${encodeURIComponent("Slot jadwal ini sudah ada")}`);
    }
    throw e;
  }
  revalidatePath("/jadwal");
  revalidatePath("/guru");
  redirect("/jadwal");
}

export async function deleteJadwal(id: string) {
  await requireAdminOrPj();
  await prisma.jadwal.delete({ where: { id } });
  revalidatePath("/jadwal");
  revalidatePath("/guru");
  redirect("/jadwal");
}