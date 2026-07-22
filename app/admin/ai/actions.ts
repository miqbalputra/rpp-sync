// Server actions konfigurasi AI (Admin). API key dienkripsi saat disimpan,
// tidak pernah dikembalikan ke client.
"use server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { encrypt } from "@/lib/ai/crypto";
import { listModels } from "@/lib/ai/client";

const ConfigSchema = z.object({
  enabled: z.boolean(),
  endpoint: z.string().trim().max(300),
  model: z.string().trim().max(200),
});

type FetchModelsResult = { ok: true; models: string[] } | { ok: false; error: string };

/** Simpan konfigurasi AI (singleton). API key hanya diupdate bila field diisi. */
export async function simpanPengaturanAi(formData: FormData) {
  await requireAdmin();

  const enabled = formData.get("enabled") === "on";
  const endpoint = String(formData.get("endpoint") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const apiKeyRaw = String(formData.get("apiKey") ?? "").trim();

  // Endpoint wajib bila enabled.
  const parsed = ConfigSchema.safeParse({
    enabled,
    endpoint,
    model,
  });
  if (!parsed.success) {
    redirect(`/admin/ai?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }
  const d = parsed.data;

  const data: {
    enabled: boolean;
    endpoint: string | null;
    model: string | null;
    apiKeyEnc?: string;
  } = {
    enabled: d.enabled,
    endpoint: d.endpoint || null,
    model: d.model || null,
  };

  // Hanya update apiKeyEnc bila admin mengisi field (kosong = pertahankan yang ada).
  if (apiKeyRaw) {
    data.apiKeyEnc = encrypt(apiKeyRaw);
  }

  await prisma.pengaturanAi.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });

  revalidatePath("/admin/ai");
  redirect(`/admin/ai?ok=1`);
}

/** Ambil daftar model dari endpoint untuk mengisi select. Tidak redirect. */
export async function fetchModelsAi(formData: FormData): Promise<FetchModelsResult> {
  await requireAdmin();

  let endpoint = String(formData.get("endpoint") ?? "").trim().replace(/\/$/, "");
  const apiKeyRaw = String(formData.get("apiKey") ?? "").trim();

  // Fallback ke config tersimpan bila field kosong.
  if (!endpoint || !apiKeyRaw) {
    const row = await prisma.pengaturanAi.findUnique({ where: { id: "singleton" } });
    if (!endpoint && row?.endpoint) endpoint = row.endpoint.replace(/\/$/, "");
  }

  if (!endpoint) {
    return { ok: false, error: "Endpoint belum diisi." };
  }

  // API key: pakai input baru, atau decrypt yang tersimpan.
  let apiKey = apiKeyRaw;
  if (!apiKey) {
    const row = await prisma.pengaturanAi.findUnique({ where: { id: "singleton" } });
    if (!row?.apiKeyEnc) return { ok: false, error: "API key belum disimpan. Isi field API key." };
    try {
      const { decrypt } = await import("@/lib/ai/crypto");
      apiKey = decrypt(row.apiKeyEnc);
    } catch {
      return { ok: false, error: "Gagal membaca API key tersimpan." };
    }
  }

  const res = await listModels({ endpoint, apiKey });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, models: res.data };
}