import { integrationUnauthorized, isIntegrationRequest } from "@/lib/integration/auth";
import { integrationRpp } from "@/lib/integration/source";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isIntegrationRequest(request)) return integrationUnauthorized();
  const rpp = await integrationRpp((await params).id);
  return rpp ? NextResponse.json({ data: rpp }) : NextResponse.json({ error: "RPP tidak ditemukan" }, { status: 404 });
}
