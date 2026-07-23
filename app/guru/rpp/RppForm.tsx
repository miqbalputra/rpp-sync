"use client";
// Form RPP (PRD §5.1) — React Hook Form + useFieldArray untuk pertemuan dinamis.
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RppFormSchema, RppFormValues, RppActionResult } from "@/lib/rpp/schema";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type KelasOpt = { id: string; namaKelas: string; gender: string };

export default function RppForm({
  action,
  mapelOptions,
  kelasByMapel,
  namaKepalaSekolah,
  namaUstadz,
  defaultValues,
  submitLabel = "Simpan",
}: {
  action: (values: RppFormValues) => Promise<RppActionResult> | RppActionResult;
  mapelOptions: { id: string; namaMapel: string }[];
  kelasByMapel: Record<string, KelasOpt[]>;
  namaKepalaSekolah: string | null;
  namaUstadz: string;
  defaultValues?: RppFormValues;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RppFormValues>({
    resolver: zodResolver(RppFormSchema),
    defaultValues: defaultValues ?? {
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

  const selectedMapel = watch("mapelId");
  const kelasOptions: KelasOpt[] = selectedMapel ? kelasByMapel[selectedMapel] ?? [] : [];

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await action(values);
      if (!res.ok) {
        setServerError(res.error);
        setSubmitting(false);
        return;
      }
      router.push("/guru/rpp");
      router.refresh();
    } catch (e: any) {
      setServerError(e?.message ?? "Terjadi kesalahan");
      setSubmitting(false);
    }
  });

  const inputCls =
    "w-full h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 transition focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";
  const taCls = inputCls + " h-auto min-h-[80px] py-2 resize-y";
  const errCls = "text-xs text-error-600 mt-1 dark:text-error-400";
  const labelCls = "block text-sm font-medium text-foreground mb-1.5";
  const sectionCls = "rounded-xl bg-card border border-border p-5 shadow-sm";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {serverError && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400">
          {serverError}
        </div>
      )}

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
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Materi</label>
            <input className={inputCls} {...register("materi")} placeholder="cth: Surat Al-Fatihah" />
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
        <textarea className={taCls} {...register("tujuanPembelajaran")} placeholder="Tuliskan tujuan pembelajaran..." />
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
              <textarea
                className={taCls}
                {...register(`pertemuan.${i}.isiKegiatan`)}
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