// Export daftar guru ke .xlsx (Admin only). Tanpa kolom password.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { Role } from "@prisma/client";
import { buildGuruExportWorkbook } from "@/lib/guru/excel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    where: { role: Role.GURU, deletedAt: null },
    orderBy: { nama: "asc" },
    select: { nama: true, username: true, email: true, gender: true, aktif: true },
  });

  const buffer = await buildGuruExportWorkbook(
    users.map((u) => ({
      nama: u.nama,
      username: u.username,
      email: u.email,
      gender: u.gender,
      aktif: u.aktif,
    })),
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="guru-export.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}