import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAiConfig } from "@/lib/ai/client";
import { RppSaveRequestSchema, RppUpdateRequestSchema, type RppSaveResult } from "@/lib/rpp/schema";
import { rppSaveError, saveRpp } from "@/lib/rpp/save";
import { completeRppSave } from "@/lib/rpp/save-effects";

export const runtime = "nodejs";

function reply(result: RppSaveResult) {
  const status = result.ok ? 200 : result.code === "SESSION_EXPIRED" ? 401 :
    result.code === "FORBIDDEN" ? 403 : result.code === "CONFLICT" ? 409 : result.code === "VALIDATION" ? 400 : 503;
  return NextResponse.json(result, { status, headers: { "Cache-Control": "no-store" } });
}

async function handleSave(request: NextRequest, update: boolean) {
  // JSON-only, same-origin mutations. Accept the public origin through the tunnel.
  const origins = new Set([request.nextUrl.origin, "https://rpp.griyaquran.web.id"]);
  for (const value of [process.env.NEXTAUTH_URL, process.env.AUTH_URL]) {
    if (value) { try { origins.add(new URL(value).origin); } catch { /* invalid deployment URL is not trusted */ } }
  }
  if (!origins.has(request.headers.get("origin") ?? "") || !request.headers.get("content-type")?.startsWith("application/json")) {
    return reply({ ok: false, code: "FORBIDDEN", error: "Permintaan tidak valid. Buka formulir melalui domain aplikasi." });
  }
  try {
    const session = await auth();
    if (!session?.user?.id) return reply({ ok: false, code: "SESSION_EXPIRED", error: "Sesi login berakhir. Masuk kembali lalu lanjutkan formulir ini. Cadangan isian tetap tersedia." });
    if (session.user.role !== "GURU") return reply({ ok: false, code: "FORBIDDEN", error: "Akun ini tidak memiliki akses menyimpan RPP guru." });
    let body: unknown;
    try { body = await request.json(); } catch { return reply({ ok: false, code: "VALIDATION", error: "Isi permintaan tidak dapat dibaca. Coba Simpan lagi." }); }
    const parsed = RppSaveRequestSchema.safeParse(body);
    if (!parsed.success) return reply({ ok: false, code: "VALIDATION", error: parsed.error.issues[0].message });
    const d = parsed.data;
    if (d.userId !== session.user.id) return reply({ ok: false, code: "FORBIDDEN", error: "Akun login berbeda dari pembuat isian ini. Keluar lalu masuk dengan akun semula; cadangan tetap tersedia." });
    let target: { id?: string; expectedUpdatedAt?: string } = {};
    if (update) {
      const edit = RppUpdateRequestSchema.safeParse(body);
      if (!edit.success) return reply({ ok: false, code: "VALIDATION", error: edit.error.issues[0].message });
      target = { id: edit.data.id, expectedUpdatedAt: edit.data.expectedUpdatedAt };
    }
    if (!update && d.ai && !(await getAiConfig())) return reply({ ok: false, code: "FORBIDDEN", error: "Fitur AI sedang dinonaktifkan. Cadangan isian tetap tersedia." });
    const result = await saveRpp(d.values, session, {
      ai: d.ai, submissionId: d.submissionId,
      ...target,
    });
    if (result.ok) completeRppSave(result.id);
    return reply(result);
  } catch (error) {
    return reply(rppSaveError(error, "request"));
  }
}

export async function POST(request: NextRequest) { return handleSave(request, false); }
export async function PUT(request: NextRequest) { return handleSave(request, true); }
