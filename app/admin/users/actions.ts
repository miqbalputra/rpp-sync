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
import { parseGuruImportWorkbook } from "@/lib/guru/excel";

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

// ----- Import Guru via Excel -----
export type ImportGuruResult = {
  ok: boolean;
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
};

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_ROWS = 500;

export async function importGuru(formData: FormData): Promise<ImportGuruResult> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, created: 0, skipped: 0, errors: [{ row: 0, message: "File tidak ditemukan atau kosong" }] };
  }
  const isXlsx =
    file.name.toLowerCase().endsWith(".xlsx") ||
    (file.type && file.type.includes("spreadsheet"));
  if (!isXlsx) {
    return { ok: false, created: 0, skipped: 0, errors: [{ row: 0, message: "File harus berformat .xlsx" }] };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, created: 0, skipped: 0, errors: [{ row: 0, message: "Ukuran file melebihi 2 MB" }] };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { rows, errors } = await parseGuruImportWorkbook(buffer);

  if (rows.length === 0 && errors.length === 0) {
    return { ok: false, created: 0, skipped: 0, errors: [{ row: 0, message: "Tidak ada baris data di file (isi mulai baris 2)" }] };
  }

  // Batasi jumlah baris
  let processRows = rows;
  if (rows.length > MAX_ROWS) {
    processRows = rows.slice(0, MAX_ROWS);
    errors.push({ row: 0, message: `Baris melebihi batas ${MAX_ROWS}; hanya ${MAX_ROWS} baris pertama diproses` });
  }

  // Cek unik: muat semua email + username existing sekali jalan.
  const existing = await prisma.user.findMany({ select: { email: true, username: true } });
  const emailDb = new Set(existing.map((u) => u.email.toLowerCase()));
  const usernameDb = new Set(existing.map((u) => u.username.toLowerCase()));
  const emailInFile = new Set<string>();
  const usernameInFile = new Set<string>();

  let created = 0;
  let skipped = 0;
  const rowErrors: { row: number; message: string }[] = [...errors];

  for (const r of processRows) {
    const emailLow = r.email.toLowerCase();
    const userLow = r.username.toLowerCase();

    // Duplikat di DB atau di file ini → skip (bukan error)
    if (emailDb.has(emailLow) || emailInFile.has(emailLow) || usernameDb.has(userLow) || usernameInFile.has(userLow)) {
      skipped++;
      rowErrors.push({ row: r.rowNumber, message: "Dilewati: email/username sudah ada" });
      continue;
    }

    try {
      const passwordHash = await bcrypt.hash(r.password, 10);
      const user = await prisma.user.create({
        data: {
          nama: r.nama,
          email: emailLow,
          username: r.username,
          passwordHash,
          role: Role.GURU,
          gender: (r.gender as Gender) ?? null,
          aktif: r.aktif,
        },
      });
      await ensureGuruProfile(user.id, user.nama, user.role);
      emailDb.add(emailLow);
      usernameDb.add(userLow);
      emailInFile.add(emailLow);
      usernameInFile.add(userLow);
      created++;
    } catch (e: any) {
      rowErrors.push({ row: r.rowNumber, message: e?.code === "P2002" ? "Email/username sudah dipakai" : "Gagal menyimpan" });
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");

  return { ok: true, created, skipped, errors: rowErrors };
}