"use client";
// Form RPP (PRD §5.1) — React Hook Form + useFieldArray untuk pertemuan dinamis.
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RppFormSchema, RppSaveResultSchema, type RppFormValues } from "@/lib/rpp/schema";
import { finishRppDraft, listRppDrafts, newSubmissionId, rppDraftKey, writeRppDraft, type RppLocalDraft } from "@/lib/rpp/draft-storage";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AutoNumberTextarea } from "./AutoNumberTextarea";

type KelasOpt = { id: string; namaKelas: string; gender: string };
type RppFormProps = {
  userId: string;
  rppId?: string;
  expectedUpdatedAt?: string;
  ai?: boolean;
  mapelOptions: { id: string; namaMapel: string }[];
  kelasByMapel: Record<string, KelasOpt[]>;
  namaKepalaSekolah: string | null;
  namaUstadz: string;
  defaultValues?: RppFormValues;
  submitLabel?: string;
};
const subscribeHydration = () => () => {};

export default function RppForm(props: RppFormProps) {
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  if (!hydrated) return <p role="status">Menyiapkan formulir dan cadangan draf…</p>;
  return <DraftRppForm key={`${props.userId}:${props.rppId ?? (props.ai ? "ai" : "manual")}`} {...props} />;
}

function DraftRppForm({
  userId,
  rppId,
  expectedUpdatedAt,
  ai = false,
  mapelOptions,
  kelasByMapel,
  namaKepalaSekolah,
  namaUstadz,
  defaultValues,
  submitLabel = "Simpan",
}: RppFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [savedRppId, setSavedRppId] = useState<string | null>(null);
  const storageKey = rppDraftKey(userId, rppId ? `edit:${rppId}` : ai ? "new:ai" : "new:manual");
  const [recovery] = useState(() => {
    try {
      const latest = listRppDrafts(localStorage, storageKey)[0];
      const occupied = !latest && localStorage.getItem(storageKey) !== null;
      return { draft: latest?.draft ?? null, key: latest?.key ?? (occupied ? `${storageKey}:copy:${newSubmissionId()}` : storageKey), error: false };
    }
    catch { return { draft: null, error: true }; }
  });
  const staleDraft = Boolean(rppId && recovery.draft && recovery.draft.expectedUpdatedAt !== expectedUpdatedAt);
  const [otherDrafts] = useState(() => {
    try { return [...listRppDrafts(localStorage, storageKey).filter((entry) => staleDraft || entry.key !== recovery.key), ...listRppDrafts(localStorage, storageKey, true)]; }
    catch { return []; }
  });
  const [backupState, setBackupState] = useState<"saved" | "unavailable" | "pending">(recovery.error ? "unavailable" : recovery.draft ? "saved" : "pending");
  const submissionId = useRef(!staleDraft && recovery.draft ? recovery.draft.submissionId : newSubmissionId());
  const baseUpdatedAt = staleDraft ? expectedUpdatedAt : recovery.draft?.expectedUpdatedAt ?? expectedUpdatedAt;
  const savedToServer = useRef(false);
  const backupAvailable = useRef(!recovery.error && Boolean(recovery.draft));
  const inFlight = useRef(false);
  const errorBox = useRef<HTMLDivElement>(null);
  const lastWritten = useRef<string | null | undefined>(undefined);
  const activeStorageKey = useRef(staleDraft ? `${storageKey}:copy:${newSubmissionId()}` : recovery.key ?? storageKey);
  const dirty = useRef(Boolean(recovery.draft));

  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    subscribe,
    formState: { errors },
  } = useForm<RppFormValues>({
    resolver: zodResolver(RppFormSchema),
    defaultValues: (!staleDraft ? recovery.draft?.values : null) ?? defaultValues ?? {
      mapelId: "",
      kelasId: "",
      noRpp: "",
      materi: "",
      alokasiWaktu: "",
      tujuanPembelajaran: "",
      tanggalPengesahan: today,
      pertemuan: [{ isiKegiatan: "", tanggal: "" }],
      penilaian: { pengetahuan: "", keterampilan: "", sikap: "" },
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "pertemuan" });

  const selectedMapel = useWatch({ control, name: "mapelId" });
  const kelasOptions: KelasOpt[] = selectedMapel ? kelasByMapel[selectedMapel] ?? [] : [];

  function backup(values: RppFormValues): void {
    if (savedToServer.current) return;
    const draft: RppLocalDraft = {
      version: 1, submissionId: submissionId.current, savedAt: new Date().toISOString(),
      expectedUpdatedAt: baseUpdatedAt, values,
    };
    try {
      const current = localStorage.getItem(activeStorageKey.current);
      // Preserve another tab's version instead of overwriting it.
      if (lastWritten.current !== undefined && current !== lastWritten.current) {
        activeStorageKey.current = `${storageKey}:copy:${newSubmissionId()}`;
      }
      writeRppDraft(localStorage, activeStorageKey.current, draft);
      lastWritten.current = localStorage.getItem(activeStorageKey.current);
      backupAvailable.current = true;
      setBackupState("saved");
    } catch { backupAvailable.current = false; setBackupState("unavailable"); }
  }
  const backupRef = useRef(backup);
  useEffect(() => { backupRef.current = backup; });

  useEffect(() => {
    // Save every change immediately, including before a phone backgrounds the tab.
    try { lastWritten.current = localStorage.getItem(activeStorageKey.current); } catch { /* surface the unavailable backup state */ }
    const initialSave = window.setTimeout(() => backupRef.current(getValues()), 0);
    const unsubscribe = subscribe({ formState: { values: true }, callback: ({ values }) => {
      dirty.current = true;
      backupRef.current(values);
    } });
    const flush = () => backupRef.current(getValues());
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      flush();
      if (dirty.current && !savedToServer.current && !backupAvailable.current) { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => {
      window.clearTimeout(initialSave);
      unsubscribe();
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("beforeunload", warnBeforeLeaving);
    };
  }, [getValues, storageKey, subscribe]);

  useEffect(() => { if (serverError) errorBox.current?.focus(); }, [serverError]);

  function downloadBackup(values = getValues()) {
    const text = [
      `RPP ${values.noRpp ?? ""}`, `Mapel: ${mapelOptions.find((m) => m.id === values.mapelId)?.namaMapel ?? values.mapelId}`,
      `Kelas: ${kelasByMapel[values.mapelId]?.find((k) => k.id === values.kelasId)?.namaKelas ?? values.kelasId}`,
      `Materi: ${values.materi}`, `Alokasi waktu: ${values.alokasiWaktu}`,
      `Tujuan pembelajaran:\n${values.tujuanPembelajaran}`,
      ...values.pertemuan.map((p, i) => `Pertemuan ${i + 1} (${p.tanggal ?? ""}):\n${p.isiKegiatan}`),
      `Pengetahuan:\n${values.penilaian.pengetahuan}`, `Keterampilan:\n${values.penilaian.keterampilan}`,
      `Sikap:\n${values.penilaian.sikap}`, `Tanggal pengesahan: ${values.tanggalPengesahan}`,
    ].join("\n\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "cadangan-rpp.txt"; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => handleSubmit(async (values) => {
    if (inFlight.current) return;
    inFlight.current = true;
    backup(values);
    setServerError(null);
    setSessionExpired(false);
    setSubmitting(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch("/api/rpp", {
        method: rppId ? "PUT" : "POST", credentials: "same-origin", cache: "no-store", redirect: "error",
        headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ values, userId, submissionId: submissionId.current, ai, ...(rppId ? { id: rppId, expectedUpdatedAt: baseUpdatedAt } : {}) }),
      });
      const res = RppSaveResultSchema.parse(await response.json());
      if (!res.ok) {
        setServerError(res.error);
        setSessionExpired(res.code === "SESSION_EXPIRED");
        if (res.id || (res.code === "CONFLICT" && rppId)) setSavedRppId(res.id ?? rppId!);
        return;
      }
      if (!response.ok || !res.id) throw new Error("Jawaban server tidak dapat dikonfirmasi");
      savedToServer.current = true;
      try { finishRppDraft(localStorage, storageKey, submissionId.current, values); } catch { /* retain the backup when storage is unavailable */ }
      // A full navigation also refreshes stale code after deployment.
      window.location.assign(`/guru/rpp/${encodeURIComponent(res.id)}`);
    } catch {
      setServerError("Belum ada konfirmasi dari server. Isian tetap ada di formulir. Periksa koneksi lalu coba Simpan lagi; pengiriman yang sama tidak akan membuat RPP ganda.");
    } finally {
      window.clearTimeout(timeout);
      inFlight.current = false;
      setSubmitting(false);
    }
  }, () => {
    setServerError("Ada kolom wajib yang belum lengkap. Periksa kolom bertanda merah; isian tetap tersedia.");
  })(event);

  const inputCls =
    "w-full h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 transition focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";
  const taCls = inputCls + " h-auto min-h-[80px] py-2 resize-y";
  const errCls = "text-xs text-error-600 mt-1 dark:text-error-400";
  const labelCls = "block text-sm font-medium text-foreground mb-1.5";
  const sectionCls = "rounded-xl bg-card border border-border p-5 shadow-sm";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div role="status" className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
        {backupState === "unavailable"
          ? "Cadangan otomatis tidak tersedia di browser ini. Unduh cadangan agar isian tetap Anda miliki."
          : backupState === "pending" ? "Menyiapkan cadangan otomatis…"
          : staleDraft ? "RPP sudah berubah sejak draf dibuat. Form menampilkan versi server terbaru. Unduh cadangan versi lama di bawah untuk menggabungkan isian Anda."
          : recovery.draft ? "Draf yang belum selesai dipulihkan dari browser ini. Tekan Simpan untuk menyimpannya ke server."
          : "Isian dicadangkan otomatis di browser ini. Tekan Simpan untuk menyimpannya ke server."}
        <button type="button" onClick={() => downloadBackup()} className="ml-2 font-semibold text-primary underline">Unduh cadangan</button>
        {otherDrafts.length > 0 && <details className="mt-2">
          <summary>Cadangan versi lain ({otherDrafts.length})</summary>
          {otherDrafts.map((entry) => <button key={entry.key} type="button" onClick={() => downloadBackup(entry.draft.values)} className="mt-1 block text-primary underline">
            Unduh {entry.draft.values.materi || "draf"} — {new Date(entry.draft.savedAt).toLocaleString("id-ID")}
          </button>)}
        </details>}
      </div>
      {serverError && (
        <div ref={errorBox} role="alert" tabIndex={-1} className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400">
          {serverError}
          {sessionExpired && <a className="ml-2 font-semibold underline" href={`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`}>Masuk kembali</a>}
          {savedRppId && <a className="ml-2 font-semibold underline" href={`/guru/rpp/${encodeURIComponent(savedRppId)}/edit`}>Buka RPP tersimpan</a>}
        </div>
      )}

      <fieldset disabled={submitting} className="min-w-0 space-y-6">

      {/* Header */}
      <section className={sectionCls}>
        <h2 className="text-sm font-semibold text-foreground mb-4">Header</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelCls}>No. RPP</label>
            <input
              className={inputCls}
              {...register("noRpp")}
              placeholder="cth: 001/RPP/2026 (opsional, untuk membedakan & memudahkan pencarian)"
              maxLength={50}
            />
            {errors.noRpp && <p className={errCls}>{errors.noRpp.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Mata Pelajaran</label>
            <select
              className={inputCls}
              {...register("mapelId")}
              onChange={(e) => {
                setValue("mapelId", e.target.value, { shouldValidate: true });
                setValue("kelasId", "");
              }}
            >
              <option value="">— pilih mapel —</option>
              {mapelOptions.map((m) => (
                <option key={m.id} value={m.id}>{m.namaMapel}</option>
              ))}
            </select>
            {errors.mapelId && <p className={errCls}>{errors.mapelId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Kelas</label>
            <select className={inputCls} {...register("kelasId")} disabled={!selectedMapel}>
              <option value="">— pilih kelas —</option>
              {kelasOptions.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.namaKelas} ({k.gender === "IKHWAN" ? "Ikhwan" : "Akhwat"})
                </option>
              ))}
            </select>
            {errors.kelasId && <p className={errCls}>{errors.kelasId.message}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-1.5">Materi</label>
            <AutoNumberTextarea
              name="materi"
              register={register}
              setValue={setValue}
              className={taCls}
              placeholder="cth: Surat Al-Fatihah"
            />
            {errors.materi && <p className={errCls}>{errors.materi.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Alokasi Waktu</label>
            <input className={inputCls} {...register("alokasiWaktu")} placeholder="cth: 4 x 35 menit" />
            {errors.alokasiWaktu && <p className={errCls}>{errors.alokasiWaktu.message}</p>}
          </div>
        </div>
      </section>

      {/* Tujuan Pembelajaran */}
      <section className="rounded-xl bg-card border border-border p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground mb-4">Tujuan Pembelajaran</h2>
        <AutoNumberTextarea
          name="tujuanPembelajaran"
          register={register}
          setValue={setValue}
          className={taCls}
          placeholder="Tuliskan tujuan pembelajaran..."
        />
        {errors.tujuanPembelajaran && <p className={errCls}>{errors.tujuanPembelajaran.message}</p>}
      </section>

      {/* Kegiatan Pembelajaran — pertemuan dinamis */}
      <section className="rounded-xl bg-card border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Kegiatan Pembelajaran</h2>
          <button
            type="button"
            onClick={() => append({ isiKegiatan: "", tanggal: "" })}
            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Pertemuan
          </button>
        </div>
        {errors.pertemuan && typeof errors.pertemuan.message === "string" && (
          <p className={errCls + " mb-2"}>{errors.pertemuan.message}</p>
        )}
        <div className="space-y-3">
          {fields.map((f, i) => (
            <div key={f.id} className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground">Pertemuan {i + 1}</span>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="text-xs text-error-600 hover:underline dark:text-error-400"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <div className="mb-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Tanggal KBM (opsional)</label>
                <input
                  type="date"
                  className={inputCls + " h-9"}
                  {...register(`pertemuan.${i}.tanggal`)}
                />
                {errors.pertemuan?.[i]?.tanggal && (
                  <p className={errCls}>{errors.pertemuan[i]?.tanggal?.message}</p>
                )}
              </div>
              <AutoNumberTextarea
                name={`pertemuan.${i}.isiKegiatan`}
                register={register}
                setValue={setValue}
                className={taCls}
                placeholder={`Isi kegiatan pertemuan ${i + 1}...`}
              />
              {errors.pertemuan?.[i]?.isiKegiatan && (
                <p className={errCls}>{errors.pertemuan[i]?.isiKegiatan?.message}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Penilaian */}
      <section className="rounded-xl bg-card border border-border p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground mb-4">Penilaian</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Pengetahuan</label>
            <textarea className={taCls} {...register("penilaian.pengetahuan")} />
            {errors.penilaian?.pengetahuan && <p className={errCls}>{errors.penilaian.pengetahuan.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Keterampilan</label>
            <textarea className={taCls} {...register("penilaian.keterampilan")} />
            {errors.penilaian?.keterampilan && <p className={errCls}>{errors.penilaian.keterampilan.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Sikap</label>
            <textarea className={taCls} {...register("penilaian.sikap")} />
            {errors.penilaian?.sikap && <p className={errCls}>{errors.penilaian.sikap.message}</p>}
          </div>
        </div>
      </section>

      {/* Pengesahan */}
      <section className="rounded-xl bg-card border border-border p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground mb-4">Pengesahan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nama Kepala Sekolah</label>
            <input
              className={inputCls + " bg-muted"}
              value={namaKepalaSekolah ?? "— belum ada data Kepala Sekolah —"}
              readOnly
            />
            <p className="text-xs text-muted-foreground mt-1">Otomatis dari master data</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nama Ustadz/ah Pengampu</label>
            <input className={inputCls + " bg-muted"} value={namaUstadz} readOnly />
            <p className="text-xs text-muted-foreground mt-1">Otomatis dari akun Anda</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Tanggal Pengesahan</label>
            <input type="date" className={inputCls} {...register("tanggalPengesahan")} />
            <p className="text-xs text-muted-foreground mt-1">Otomatis hari ini, bisa diedit</p>
            {errors.tanggalPengesahan && <p className={errCls}>{errors.tanggalPengesahan.message}</p>}
          </div>
        </div>
      </section>

      </fieldset>
      <div className="flex gap-2 sticky bottom-0 -mx-1 bg-background/80 backdrop-blur-sm pt-3 pb-2 px-1 border-t border-border">
        <Button type="submit" size="lg" disabled={submitting} className="px-6">
          {submitting ? "Menyimpan…" : submitLabel}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.push("/guru/rpp")}>
          Batal
        </Button>
      </div>
    </form>
  );
}
