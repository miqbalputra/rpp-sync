import { integrationUnauthorized, isIntegrationRequest } from "@/lib/integration/auth";
import { integrationChanges } from "@/lib/integration/source";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isIntegrationRequest(request)) return integrationUnauthorized();
  try {
    return NextResponse.json(await integrationChanges(request.nextUrl.searchParams.get("cursor"), request.nextUrl.searchParams.get("limit")));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal memuat perubahan" }, { status: 422 });
  }
}
