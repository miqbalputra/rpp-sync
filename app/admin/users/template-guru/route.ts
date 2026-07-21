// Download template .xlsx untuk import guru (Admin only).
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { buildGuruTemplateWorkbook } from "@/lib/guru/excel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  const buffer = await buildGuruTemplateWorkbook();
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="guru-template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}