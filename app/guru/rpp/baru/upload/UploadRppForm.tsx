"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RPP_UPLOAD_MAX_BYTES, RPP_UPLOAD_MAX_LABEL } from "@/lib/rpp/upload-constants";

type KelasOpt = { id: string; namaKelas: string; gender: string };

export default function UploadRppForm({
  mapelOptions,
  kelasByMapel,
}: {
  mapelOptions: { id: string; namaMapel: string }[];
  kelasByMapel: Record<string, KelasOpt[]>;
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [mapelId, setMapelId] = useState("");
  const [kelasId, setKelasId] = useState("");
  const [noRpp, setNoRpp] = useState("");
  const [tanggalPengesahan, setTanggalPengesahan] = useState(today);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const inputCls =
    "w-full h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 transition focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";
  const labelCls = "block text-sm font-medium text-foreground mb-1.5";
  const sectionCls = "rounded-xl bg-card border border-border p-5 shadow-sm";
  const kelasOptions = mapelId ? kelasByMapel[mapelId] ?? [] : [];

  function selectFile(nextFile: File | null) {
    setError(null);
    if (!nextFile) {
      setFile(null);
      return;
    }
    if (nextFile.type && nextFile.type !== "application/pdf") {
      setFile(null);
      setError("Format file harus PDF.");
      return;
    }
    if (nextFile.size > RPP_UPLOAD_MAX_BYTES) {
      setFile(null);
      setError(`Ukuran file PDF maksimal ${RPP_UPLOAD_MAX_LABEL}.`);
      return;
    }
    setFile(nextFile);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!mapelId || !kelasId) {
      setError("Pilih mata pelajaran dan kelas terlebih dahulu.");
      return;
    }
    if (!file) {
      setError("File RPP PDF wajib diunggah.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("mapelId", mapelId);
      formData.set("kelasId", kelasId);
      formData.set("noRpp", noRpp);
      formData.set("tanggalPengesahan", tanggalPengesahan);
      formData.set("confirmation", "1");
      formData.set("file", file);

      const response = await fetch("/api/rpp/upload", { method: "POST", body: formData });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "Gagal mengunggah RPP PDF.");
        return;
      }
      router.push(`/guru/rpp/${result.id}`);
      router.refresh();
    } catch {
      setError("Gagal menghubungi server. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400">
          {error}
        </div>
      )}

      <section className={sectionCls}>
        <h2 className="mb-4 text-sm font-semibold text-foreground">Identitas RPP</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelCls}>Mata Pelajaran</label>
            <select
              className={inputCls}
              value={mapelId}
              onChange={(event) => {
                setMapelId(event.target.value);
                setKelasId("");
              }}
            >
              <option value="">— pilih mapel —</option>
              {mapelOptions.map((mapel) => (
                <option key={mapel.id} value={mapel.id}>{mapel.namaMapel}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Kelas</label>
            <select className={inputCls} value={kelasId} onChange={(event) => setKelasId(event.target.value)} disabled={!mapelId}>
              <option value="">— pilih kelas —</option>
              {kelasOptions.map((kelas) => (
                <option key={kelas.id} value={kelas.id}>
                  {kelas.namaKelas} ({kelas.gender === "IKHWAN" ? "Ikhwan" : "Akhwat"})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>No. RPP <span className="font-normal text-muted-foreground">(opsional)</span></label>
            <input className={inputCls} value={noRpp} onChange={(event) => setNoRpp(event.target.value)} maxLength={50} placeholder="cth: 001/RPP/2026" />
          </div>
          <div>
            <label className={labelCls}>Tanggal Pengesahan</label>
            <input type="date" className={inputCls} value={tanggalPengesahan} onChange={(event) => setTanggalPengesahan(event.target.value)} />
          </div>
        </div>
      </section>

      <section className={sectionCls}>
        <h2 className="mb-1 text-sm font-semibold text-foreground">File RPP</h2>
        <p className="mb-4 text-xs text-muted-foreground">Format PDF, maksimal {RPP_UPLOAD_MAX_LABEL}.</p>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-6 py-10 text-center transition hover:border-brand-300 hover:bg-brand-50/40 dark:border-gray-700 dark:hover:border-brand-800 dark:hover:bg-white/[0.03]">
          <FileUp className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Pilih file RPP PDF</span>
          <span className="text-xs text-muted-foreground">Klik untuk memilih file dari perangkat</span>
          <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} />
        </label>
        {file && (
          <div className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
            <span className="font-medium">{file.name}</span>
            <span className="ml-2 text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
          </div>
        )}
      </section>

      <div className="flex gap-2 border-t border-border bg-background/80 px-1 py-3 backdrop-blur-sm">
        <Button type="submit" size="lg" disabled={submitting} className="px-6">
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Mengunggah…</> : <><FileUp className="h-4 w-4" /> Upload RPP</>}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.push("/guru/rpp/baru")}>
          Batal
        </Button>
      </div>
    </form>
  );
}
