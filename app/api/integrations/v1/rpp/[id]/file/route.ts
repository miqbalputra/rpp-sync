import { integrationUnauthorized, isIntegrationRequest } from "@/lib/integration/auth";
import { prisma } from "@/lib/db";
import { resolveRppUploadPath } from "@/lib/rpp/upload-storage";
import { readFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isIntegrationRequest(request)) return integrationUnauthorized();
  const id = (await params).id;
  const rpp = await prisma.rpp.findUnique({ where: { id }, include: { file: true } });
  if (!rpp?.file) return NextResponse.json({ error: "PDF RPP tidak ditemukan" }, { status: 404 });
  const path = resolveRppUploadPath(id, rpp.file.pathFile);
  if (!path) return NextResponse.json({ error: "Path file tidak valid" }, { status: 500 });
  try {
    const file = await readFile(path);
    return new NextResponse(file, { headers: { "Content-Type": rpp.file.mimeType, "Content-Length": String(file.byteLength), "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "File sumber tidak tersedia" }, { status: 404 });
  }
}
