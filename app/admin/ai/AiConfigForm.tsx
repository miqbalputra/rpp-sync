"use client";
// Form konfigurasi AI (Admin). API key hanya field password — tidak ditampilkan
// kembali; indikator "sudah disimpan" cukup. Tombol "Ambil Model" memanggil
// endpoint untuk mengisi <select> model.
import { useTransition, useState } from "react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card";
import { Button, FieldLabel, inputClass } from "@/components/admin/ui";
import { Sparkles, Loader2 } from "lucide-react";
import { simpanPengaturanAi, fetchModelsAi } from "./actions";

type Status = { enabled: boolean; endpoint: string | null; model: string | null; hasApiKey: boolean };

export function AiConfigForm({ status }: { status: Status }) {
  const [saving, startSave] = useTransition();
  const [fetching, startFetch] = useTransition();
  const [models, setModels] = useState<string[]>(status.model ? [status.model] : []);
  const [selectedModel, setSelectedModel] = useState<string | null>(status.model);
  const [fetchMsg, setFetchMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  // Indikator lokal: apakah API key sudah ada (dari server) atau sedang diisi baru.
  const [hasKey, setHasKey] = useState<boolean>(status.hasApiKey);

  function onFetchModels(fd: FormData) {
    setFetchMsg(null);
    startFetch(async () => {
      const res = await fetchModelsAi(fd);
      if (res.ok) {
        setModels(res.models);
        if (!res.models.includes(selectedModel ?? "")) setSelectedModel(res.models[0]);
        setFetchMsg({ kind: "ok", text: `Berhasil — ${res.models.length} model ditemukan.` });
      } else {
        setModels([]);
        setFetchMsg({ kind: "err", text: res.error });
      }
    });
  }

  function onSave(fd: FormData) {
    // Sertakan model terpilih ke FormData bila select dipakai.
    if (selectedModel && !fd.get("model")) fd.set("model", selectedModel);
    startSave(async () => {
      await simpanPengaturanAi(fd);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 border-b border-gray-100 dark:border-gray-800">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="space-y-0.5">
          <CardTitle>Pengaturan AI</CardTitle>
          <CardDescription>
            Hubungkan endpoint AI (OpenAI-compatible / Ollama cloud) untuk fitur &quot;Buat RPP dengan AI&quot;.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form id="ai-config-form" action={onSave} className="space-y-5">
          {/* Aktifkan */}
          <label
            htmlFor="enabled"
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-brand-300 hover:bg-brand-50/40 dark:border-gray-800 dark:hover:border-brand-800 dark:hover:bg-white/[0.03]"
          >
            <input
              id="enabled"
              name="enabled"
              type="checkbox"
              defaultChecked={status.enabled}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 accent-brand-500 focus:ring-brand-500/30"
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium text-foreground">Aktifkan fitur AI</span>
              <span className="block text-sm text-muted-foreground">
                Saat aktif, guru melihat opsi &quot;Dibantu AI&quot; saat membuat RPP.
              </span>
            </span>
          </label>

          {/* Endpoint */}
          <div>
            <FieldLabel htmlFor="endpoint">URL Endpoint</FieldLabel>
            <input
              id="endpoint"
              name="endpoint"
              type="url"
              defaultValue={status.endpoint ?? ""}
              placeholder="cth: https://host/v1"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Base URL OpenAI-compatible. App memanggil <code className="font-mono">{'${endpoint}/models'}</code> dan <code className="font-mono">{'${endpoint}/chat/completions'}</code>.
            </p>
          </div>

          {/* API Key */}
          <div>
            <FieldLabel htmlFor="apiKey">API Key</FieldLabel>
            <input
              id="apiKey"
              name="apiKey"
              type="password"
              autoComplete="off"
              placeholder={hasKey ? "Kosongkan jika tidak diubah" : "Tempel API key"}
              className={inputClass}
              onChange={(e) => { if (e.target.value) setHasKey(true); }}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {hasKey
                ? "API key tersimpan (terenkripsi). Kosongkan field ini untuk mempertahankan key lama."
                : "Disimpan terenkripsi (AES-256-GCM), tidak pernah ditampilkan kembali."}
            </p>
          </div>

          {/* Model — fetch + select */}
          <div>
            <FieldLabel htmlFor="model">Model</FieldLabel>
            <div className="flex flex-col gap-2 sm:flex-row">
              {models.length > 0 ? (
                <select
                  id="model"
                  name="model"
                  value={selectedModel ?? ""}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className={inputClass}
                >
                  {models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : (
                <input
                  id="model"
                  name="model"
                  type="text"
                  defaultValue={status.model ?? ""}
                  placeholder="Ambil daftar model atau ketik manual"
                  className={inputClass}
                />
              )}
              <button
                type="button"
                onClick={() => {
                  const form = document.getElementById("ai-config-form") as HTMLFormElement | null;
                  if (!form) return;
                  const fd = new FormData(form);
                  onFetchModels(fd);
                }}
                disabled={fetching}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:hover:bg-white/[0.03]"
              >
                {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Ambil Model
              </button>
            </div>
            {fetchMsg && (
              <p className={`mt-2 text-sm ${fetchMsg.kind === "ok" ? "text-success-600 dark:text-success-400" : "text-error-600 dark:text-error-400"}`}>
                {fetchMsg.text}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Pilih model yang mendukung input gambar (vision). Tekan &quot;Ambil Model&quot; untuk memuat daftar dari endpoint.
            </p>
          </div>

          <CardFooter className="gap-2 px-0 pt-1">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Pengaturan
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}