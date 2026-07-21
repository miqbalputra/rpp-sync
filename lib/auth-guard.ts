// Helper proteksi Server Action / route server (RBAC, PRD §4.1 & §8).
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function getSession() {
  return auth();
}

/** Lempar kalau user belum login. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

/** Lempar kalau bukan Admin. */
export async function requireAdmin() {
  const session = await requireUser();
  if (session.user.role !== Role.ADMIN) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

/** Lempar kalau bukan Guru. */
export async function requireGuru() {
  const session = await requireUser();
  if (session.user.role !== Role.GURU) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

/** Lempar kalau bukan Kepala Sekolah. */
export async function requireKepala() {
  const session = await requireUser();
  if (session.user.role !== Role.KEPALA_SEKOLAH) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

/** Lempar kalau bukan PJ Diniyyah. */
export async function requirePj() {
  const session = await requireUser();
  if (session.user.role !== Role.PJ_DINIYYAH) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

/** Lempar kalau bukan Admin atau PJ Diniyyah (kelola jadwal). */
export async function requireAdminOrPj() {
  const session = await requireUser();
  if (session.user.role !== Role.ADMIN && session.user.role !== Role.PJ_DINIYYAH) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

/** Lempar kalau bukan pengirim pesan (Admin/Kepala/PJ). */
export async function requireSender() {
  const session = await requireUser();
  if (
    session.user.role !== Role.ADMIN &&
    session.user.role !== Role.KEPALA_SEKOLAH &&
    session.user.role !== Role.PJ_DINIYYAH
  ) {
    throw new Error("FORBIDDEN");
  }
  return session;
}