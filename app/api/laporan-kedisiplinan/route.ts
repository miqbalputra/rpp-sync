import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  RPP_DISCIPLINE_EXPORT_EXTENSION,
  RPP_DISCIPLINE_EXPORT_MIME,
  renderRppDisciplineReport,
  type RppDisciplineExportFormat,
} from "@/lib/discipline-rpp/export";
import { getRppDisciplineReport } from "@/lib/discipline-rpp/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Silakan login untuk mengunduh laporan." }, { status: 401 });
  }
  if (session.user.role !== Role.ADMIN && session.user.role !== Role.PJ_DINIYYAH) {
    return NextResponse.json({ error: "Akses laporan kedisiplinan tidak diizinkan." }, { status: 403 });
  }

  const requestedFormat = new URL(request.url).searchParams.get("format");
  const format: RppDisciplineExportFormat = requestedFormat === "image" ? "image" : "pdf";
  const report = await getRppDisciplineReport();
  const output = await renderRppDisciplineReport(report, format);
  const date = report.generatedAt.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const filename = `laporan-kedisiplinan-rpp-${date}.${RPP_DISCIPLINE_EXPORT_EXTENSION[format]}`;

  return new NextResponse(output, {
    headers: {
      "Content-Type": RPP_DISCIPLINE_EXPORT_MIME[format],
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(output.length),
      "Cache-Control": "no-store",
    },
  });
}
