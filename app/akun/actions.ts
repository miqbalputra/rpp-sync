// Server actions self-service Akun (profil, password, preferensi notifikasi).
"use server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Gender } from "@prisma/client";
import { ensureGuruProfile } from "@/lib/user";

const GENDERS = ["IKHWAN", "AKHWAT"] as const;

const ProfilSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(100),
  email: z.string().email("Email tidak valid"),
  username: z.string().min(3, "Username minimal 3 karakter").max(50),
  gender: z.enum(GENDERS, { message: "Gender tidak valid" }).optional(),
});

const PasswordSchema = z
  .object({
    passwordLama: z.string().min(1, "Password lama wajib diisi"),
    passwordBaru: z.string().min(6, "Password baru minimal 6 karakter"),
    konfirmasi: z.string().min(1, "Konfirmasi wajib diisi"),
  })
  .refine((d) => d.passwordBaru === d.konfirmasi, {
    message: "Konfirmasi tidak cocok",
    path: ["konfirmasi"],
  });

export async function updateProfil(formData: FormData) {
  const session = await requireUser();
  const parsed = ProfilSchema.safeParse({
    nama: formData.get("nama"),
    email: String(formData.get("email") ?? "").toLowerCase(),
    username: formData.get("username"),
    gender: formData.get("gender") || undefined,
  });
  if (!parsed.success) {
    redirect(`/akun/profil?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }
  const d = parsed.data;
  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        nama: d.nama.trim(),
        email: d.email,
        username: d.username.trim(),
        gender: (d.gender as Gender) ?? null,
      },
    });
    await ensureGuruProfile(user.id, user.nama, user.role);
  } catch (e: any) {
    if (e?.code === "P2002") {
      redirect(`/akun/profil?error=${encodeURIComponent("Email atau username sudah dipakai")}`);
    }
    throw e;
  }
  revalidatePath("/");
  redirect(`/akun/profil?ok=1`);
}

export async function ubahPassword(formData: FormData) {
  const session = await requireUser();
  const parsed = PasswordSchema.safeParse({
    passwordLama: formData.get("passwordLama"),
    passwordBaru: formData.get("passwordBaru"),
    konfirmasi: formData.get("konfirmasi"),
  });
  if (!parsed.success) {
    redirect(`/akun/pengaturan?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }
  const d = parsed.data;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user || !(await bcrypt.compare(d.passwordLama, user.passwordHash))) {
    redirect(`/akun/pengaturan?error=${encodeURIComponent("Password lama salah")}`);
  }
  const passwordHash = await bcrypt.hash(d.passwordBaru, 10);
  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash } });
  revalidatePath("/");
  redirect(`/akun/pengaturan?ok=1`);
}

export async function ubahPreferensi(formData: FormData) {
  const session = await requireUser();
  const prefNotifOverdue = formData.get("prefNotifOverdue") === "on";
  await prisma.user.update({
    where: { id: session.user.id },
    data: { prefNotifOverdue },
  });
  revalidatePath("/");
  redirect(`/akun/pengaturan?ok=1`);
}