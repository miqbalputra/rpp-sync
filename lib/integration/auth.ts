import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

function configuredToken(): string | null {
  const token = process.env.SCHOOL_INTEGRATION_API_TOKEN?.trim();
  return token ? token : null;
}

export function integrationUnauthorized(): NextResponse {
  return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
}

/** Authenticate the school backend, never a browser session. */
export function isIntegrationRequest(request: NextRequest): boolean {
  const expected = configuredToken();
  const value = request.headers.get("authorization");
  if (!expected || !value?.startsWith("Bearer ")) return false;

  const provided = value.slice("Bearer ".length);
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);

  return expectedBuffer.length === providedBuffer.length
    && timingSafeEqual(expectedBuffer, providedBuffer);
}
