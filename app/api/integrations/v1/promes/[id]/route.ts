import { integrationUnauthorized, isIntegrationRequest } from "@/lib/integration/auth";
import { integrationPromes } from "@/lib/integration/source";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isIntegrationRequest(request)) return integrationUnauthorized();
  const promes = await integrationPromes((await params).id);
  return promes ? NextResponse.json({ data: promes }) : NextResponse.json({ error: "Promes tidak ditemukan" }, { status: 404 });
}
