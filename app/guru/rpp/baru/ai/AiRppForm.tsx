"use client";
// Form 2-langkah: (1) pilih mapel+kelas & upload foto → generate draft via AI;
// (2) review & edit draft (reuse RppForm) → simpan (createRppAi, flag AI).
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Camera, RefreshCw } from "lucide-react";
import RppForm from "../../RppForm";
import { createRppAi, generateRppDraft } from "../../actions";
import type { RppFormValues, AiDraft } from "@/lib/rpp/schema";

type KelasOpt = { id: string; namaKelas: string; gender: string };

export default function AiRppForm({
  mapelOptions,
  kelasByMapel,
  namaKepalaSekolah,
  namaUstadz,
}: {
  mapelOptions: { id: string; namaMapel: string }[];
  kelasByMapel: Record<string, KelasOpt[]>;
  namaKepalaSekolah: string | null;
  namaUstadz: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [mapelId, setMapelId] = useState("");
  const [kelasId, setKelasId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<AiDraft | null>(null);

  const kelasOptions: KelasOpt[] = mapelId ? kelasByMapel[mapelId] ?? [] : [];

  function onPickFile(f: File | null) {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function onGenerate() {
    setError(null);
    if (!mapelId || !kelasId) {
      setError("Pilih mata pelajaran & kelas terlebih dahulu.");
      return;
    }
    if (!file) {
      setError("Unggah foto materi terlebih dahulu.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("foto", file);
      const res = await generateRppDraft(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDraft(res.draft);
    } catch (e: any) {
      setError(e?.message ?? "Gagal memanggil AI.");
    } finally {
      setLoading(false);
    }
  }

  function resetToStep1() {
    setDraft(null);
  }

  const inputCls =
    "w-full h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 transition focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";
  const labelCls = "block text-sm font-medium text-foreground mb-1.5";
  const errCls = "text-xs text-error-600 mt-1 dark:text-error-400";
  const sectionCls = "rounded-xl bg-card border border-border p-5 shadow-sm";

  // ---- Langkah 2: review dengan RppForm prefilled ----
  if (draft) {
    const defaultValues: RppFormValues = {
      mapelId,
      kelasId,
      noRpp: "",
      materi: draft.materi,
      alokasiWaktu: draft.alokasiWaktu,
      tujuanPembelajaran: draft.tujuanPembelajaran,
      tanggalPengesahan: today,
      pertemuan: draft.pertemuan.map((p) => ({ isiKegiatan: p.isiKegiatan, tanggal: "" })),
      penilaian: { ...draft.penilaian },
    };
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/15">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <Sparkles className="mr-1.5 inline h-4 w-4" />
            Kolom diisi AI — periksa &amp; sesuaikan sebelum menyimpan.
          </p>
          <Button type="button" variant="outline" onClick={resetToStep1}>
            <RefreshCw className="h-4 w-4" /> Ganti foto / ulang
          </Button>
        </div>
        <RppForm
          action={createRppAi}
          mapelOptions={mapelOptions}
          kelasByMapel={kelasByMapel}
          namaKepalaSekolah={namaKepalaSekolah}
          namaUstadz={namaUstadz}
          defaultValues={defaultValues}
          submitLabel="Simpan RPP (Dibantu AI)"
        />
      </div>
    );
  }

  // ---- Langkah 1: pilih mapel/kelas + upload foto ----
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onGenerate();
      }}
      className="space-y-6"
    >
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400">
          {error}
        </div>
      )}

      <section className={sectionCls}>
        <h2 className="text-sm font-semibold text-foreground mb-4">Pilih Mapel &amp; Kelas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Mata Pelajaran</label>
            <select
              className={inputCls}
              value={mapelId}
              onChange={(e) => {
                setMapelId(e.target.value);
                setKelasId("");
              }}
            >
              <option value="">— pilih mapel —</option>
              {mapelOptions.map((m) => (
                <option key={m.id} value={m.id}>{m.namaMapel}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Kelas</label>
            <select
              className={inputCls}
              value={kelasId}
              onChange={(e) => setKelasId(e.target.value)}
              disabled={!mapelId}
            >
              <option value="">— pilih kelas —</option>
              {kelasOptions.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.namaKelas} ({k.gender === "IKHWAN" ? "Ikhwan" : "Akhwat"})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className={sectionCls}>
        <h2 className="text-sm font-semibold text-foreground mb-1">Foto Materi</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Foto buku/handout materi pembelajaran. AI akan membaca isinya. JPG/PNG/WebP, maks 5MB.
        </p>

        {preview ? (
          <div className="mb-4 overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Pratinjau foto materi" className="max-h-72 w-full object-contain bg-muted" />
          </div>
        ) : (
          <label
            htmlFor="foto"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-6 py-10 text-center transition hover:border-brand-300 hover:bg-brand-50/40 dark:border-gray-700 dark:hover:border-brand-800 dark:hover:bg-white/[0.03]"
          >
            <Camera className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Pilih / ambil foto materi</span>
            <span className="text-xs text-muted-foreground">Klik untuk unggah dari galeri atau kamera</span>
          </label>
        )}

        <input
          id="foto"
          name="foto"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
        />

        {file && (
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="truncate text-sm text-muted-foreground">{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
            <button
              type="button"
              onClick={() => onPickFile(null)}
              className="text-xs text-error-600 hover:underline dark:text-error-400"
            >
              Ganti foto
            </button>
          </div>
        )}

        <div className="mt-5">
          <Button type="submit" size="lg" disabled={loading} className="px-6">
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> AI sedang membaca…</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate dengan AI</>
            )}
          </Button>
        </div>
        {loading && (
          <p className="mt-2 text-xs text-muted-foreground">
            Proses bisa memakan waktu hingga ~90 detik. Tunggu sebentar.
          </p>
        )}
      </section>
    </form>
  );
}