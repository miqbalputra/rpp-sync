// Klien AI (OpenAI-compatible — cocok untuk Ollama cloud & layanan serupa).
// Semua panggilan server-side. API key tidak pernah diekspos ke client.
import { prisma } from "@/lib/db";
import { decrypt } from "./crypto";

export type AiConfig = {
  enabled: boolean;
  endpoint: string;
  apiKey: string;
  model: string;
};

export type AiResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Baca konfigurasi AI singleton; decrypt API key. Null jika belum diaktifkan/lengkap. */
export async function getAiConfig(): Promise<AiConfig | null> {
  const row = await prisma.pengaturanAi.findUnique({ where: { id: "singleton" } });
  if (!row || !row.enabled || !row.endpoint || !row.apiKeyEnc || !row.model) return null;
  try {
    return {
      enabled: row.enabled,
      endpoint: row.endpoint.replace(/\/$/, ""),
      apiKey: decrypt(row.apiKeyEnc),
      model: row.model,
    };
  } catch {
    return null;
  }
}

/** Versi config untuk admin (status ada/tidak, TANPA mengembalikan apiKey). */
export async function getAiConfigStatus(): Promise<{
  enabled: boolean;
  endpoint: string | null;
  model: string | null;
  hasApiKey: boolean;
}> {
  const row = await prisma.pengaturanAi.findUnique({ where: { id: "singleton" } });
  return {
    enabled: row?.enabled ?? false,
    endpoint: row?.endpoint ?? null,
    model: row?.model ?? null,
    hasApiKey: !!row?.apiKeyEnc,
  };
}

function authHeaders(apiKey: string): Record<string, string> {
  return { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
}

async function withTimeout<T>(ms: number, fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fn(ctrl.signal);
  } finally {
    clearTimeout(t);
  }
}

/** Ambil daftar model dari endpoint (GET ${endpoint}/models). */
export async function listModels(cfg: { endpoint: string; apiKey: string }): Promise<AiResult<string[]>> {
  try {
    const res = await withTimeout(15000, (signal) =>
      fetch(`${cfg.endpoint}/models`, { headers: authHeaders(cfg.apiKey), signal })
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `Endpoint merespons ${res.status}. ${body.slice(0, 200)}` };
    }
    const json = await res.json();
    const models: string[] = Array.isArray(json?.data)
      ? json.data.map((m: any) => m?.id).filter(Boolean)
      : Array.isArray(json?.models)
        ? json.models.map((m: any) => (typeof m === "string" ? m : m?.name ?? m?.id)).filter(Boolean)
        : [];
    if (models.length === 0) return { ok: false, error: "Endpoint tidak mengembalikan daftar model." };
    return { ok: true, data: models };
  } catch (e: any) {
    if (e?.name === "AbortError") return { ok: false, error: "Timeout (15s) saat mengambil daftar model." };
    return { ok: false, error: `Gagal terhubung: ${e?.message ?? e}` };
  }
}

/** Panggil model vision dengan gambar + prompt, kembalikan content text. */
export async function callVisionModel(
  cfg: AiConfig,
  imageBuffer: Buffer,
  mime: string,
  prompt: string
): Promise<AiResult<string>> {
  const dataUrl = `data:${mime};base64,${imageBuffer.toString("base64")}`;
  const body = {
    model: cfg.model,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  };
  try {
    const res = await withTimeout(90000, (signal) =>
      fetch(`${cfg.endpoint}/chat/completions`, {
        method: "POST",
        headers: authHeaders(cfg.apiKey),
        body: JSON.stringify(body),
        signal,
      })
    );
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, error: `AI merespons ${res.status}. ${txt.slice(0, 300)}` };
    }
    const json = await res.json();
    const content: string | undefined = json?.choices?.[0]?.message?.content;
    if (!content) return { ok: false, error: "AI tidak mengembalikan isi." };
    return { ok: true, data: content };
  } catch (e: any) {
    if (e?.name === "AbortError") return { ok: false, error: "Timeout (90s) saat memanggil AI." };
    return { ok: false, error: `Gagal memanggil AI: ${e?.message ?? e}` };
  }
}