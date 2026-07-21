// Server actions CRUD User.
"use server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Role, Gender } from "@prisma/client";
import { ensureGuruProfile } from "@/lib/user";

const ROLES = ["ADMIN", "KEPALA_SEKOLAH", "PJ_DINIYYAH", "GURU"] as const;
const GENDERS = ["IKHWAN", "AKHWAT"] as const;

const UserCreateSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(100),
  email: z.string().email("Email tidak valid"),
  username: z.string().min(3, "Username minimal 3 karakter").max(50),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(ROLES, { message: "Role tidak valid" }),
  gender: z.enum(GENDERS, { message: "Gender wajib dipilih" }).optional(),
  aktif: z.string().optional(),
});

const UserUpdateSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(100),
  email: z.string().email("Email tidak valid"),
  username: z.string().min(3, "Username minimal 3 karakter").max(50),
  password: z.string().optional(), // kosong = tidak ganti
  role: z.enum(ROLES, { message: "Role tidak valid" }),
  gender: z.enum(GENDERS, { message: "Gender wajib dipilih" }).optional(),
  aktif: z.string().optional(),
});

export async function createUser(formData: FormData) {
  await requireAdmin();
  const parsed = UserCreateSchema.safeParse({
    nama: formData.get("nama"),
    email: String(formData.get("email") ?? "").toLowerCase(),
    username: formData.get("username"),
    password: formData.get("password"),
    role: formData.get("role"),
    gender: formData.get("gender") || undefined,
    aktif: formData.get("aktif") ? "on" : undefined,
  });
  if (!parsed.success) {
    redirect(`/admin/users/baru?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }
  const data = parsed.data;
  const passwordHash = await bcrypt.hash(data.password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        nama: data.nama.trim(),
        email: data.email,
        username: data.username.trim(),
        passwordHash,
        role: data.role,
        gender: (data.gender as Gender) ?? null,
        aktif: data.aktif === "on",
      },
    });
    await ensureGuruProfile(user.id, user.nama, user.role);
  } catch (e: any) {
    if (e?.code === "P2002") {
      redirect(`/admin/users/baru?error=${encodeURIComponent("Email atau username sudah dipakai")}`);
    }
    throw e;
  }
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  redirect("/admin/users");
}

export async function updateUser(id: string, formData: FormData) {
  await requireAdmin();
  const parsed = UserUpdateSchema.safeParse({
    nama: formData.get("nama"),
    email: String(formData.get("email") ?? "").toLowerCase(),
    username: formData.get("username"),
    password: formData.get("password") || undefined,
    role: formData.get("role"),
    gender: formData.get("gender") || undefined,
    aktif: formData.get("aktif") ? "on" : undefined,
  });
  if (!parsed.success) {
    redirect(`/admin/users/${id}/edit?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }
  const data = parsed.data;
  const update: any = {
    nama: data.nama.trim(),
    email: data.email,
    username: data.username.trim(),
    role: data.role,
    gender: (data.gender as Gender) ?? null,
    aktif: data.aktif === "on",
  };
  if (data.password && data.password.length > 0) {
    if (data.password.length < 6) {
      redirect(`/admin/users/${id}/edit?error=${encodeURIComponent("Password minimal 6 karakter")}`);
    }
    update.passwordHash = await bcrypt.hash(data.password, 10);
  }

  try {
    const user = await prisma.user.update({ where: { id }, data: update });
    await ensureGuruProfile(user.id, user.nama, user.role);
  } catch (e: any) {
    if (e?.code === "P2002") {
      redirect(`/admin/users/${id}/edit?error=${encodeURIComponent("Email atau username sudah dipakai")}`);
    }
    throw e;
  }
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function deleteUser(id: string) {
  await requireAdmin();
  try {
    await prisma.user.delete({ where: { id } });
  } catch (e: any) {
    redirect(`/admin/users?error=${encodeURIComponent("User tidak bisa dihapus (mungkin masih ada RPP/log terkait). Nonaktifkan saja.")}`);
  }
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  redirect("/admin/users");
}