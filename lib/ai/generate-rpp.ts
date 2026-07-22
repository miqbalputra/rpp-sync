// Orkestrasi: gambar -> AI -> draft RPP tervalidasi. Dipakai server action guru.
import { getAiConfig, callVisionModel } from "./client";
import { buildRppPrompt } from "./prompt";
import { AiDraftSchema, AiDraft } from "@/lib/rpp/schema";

export type GenerateRppOutcome = { ok: true; draft: AiDraft } | { ok: false; error: string };

/** Ambil hanya bagian JSON dari output AI (buang code fence & teks sisa). */
function extractJson(content: string): string {
  let s = content.trim();
  // Buang pembungkus ```json ... ``` atau ``` ... ``` jika ada.
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) s = fence[1].trim();
  // Jika masih ada teks sebelum/sesudah JSON, ambil dari { pertama ke } terakhir.
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) s = s.slice(start, end + 1);
  return s;
}

export async function generateRppFromImage(
  imageBuffer: Buffer,
  mime: string
): Promise<GenerateRppOutcome> {
  const cfg = await getAiConfig();
  if (!cfg) return { ok: false, error: "Fitur AI belum dikonfigurasi atau belum diaktifkan Admin." };

  const res = await callVisionModel(cfg, imageBuffer, mime, buildRppPrompt());
  if (!res.ok) return { ok: false, error: res.error };

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(res.data));
  } catch {
    return { ok: false, error: "AI tidak mengembalikan JSON valid. Coba foto lebih jelas / ulangi." };
  }

  const valid = AiDraftSchema.safeParse(parsed);
  if (!valid.success) {
    return { ok: false, error: `Hasil AI tidak lengkap: ${valid.error.issues[0].message}` };
  }
  return { ok: true, draft: valid.data };
}