// Tampilan RPP (read-only). Dipakai di halaman detail & export (Tahap 7).
export type RppViewData = {
  materi: string;
  alokasiWaktu: string;
  tujuanPembelajaran: string;
  tanggalPengesahan: Date | string;
  mapelNama: string;
  kelasNama: string;
  kelasGender?: string;
  semester?: string;
  tahunAjaran?: string;
  namaUstadz: string;
  namaKepalaSekolah: string | null;
  tempat?: string;
  pertemuan: { urutan: number; isiKegiatan: string }[];
  penilaian: { pengetahuan: string; keterampilan: string; sikap: string } | null;
};

function fmtTanggal(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

// Wrapper styling untuk halaman web (export pakai RppTemplateExport terpisah).
export function RppView({ data }: { data: RppViewData }) {
  return (
    <article className="space-y-5 text-slate-800">
      <header className="border-b-2 border-emerald-700 pb-3">
        <div className="text-center font-bold text-lg uppercase tracking-wide">Rencana Pelaksanaan Pembelajaran</div>
      </header>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <Field label="Mata Pelajaran" value={data.mapelNama} />
        <Field label="Kelas / Semester" value={`${data.kelasNama}${data.semester ? ` / ${data.semester}` : ""}`} />
        <Field label="Materi" value={data.materi} />
        <Field label="Alokasi Waktu" value={data.alokasiWaktu} />
        {data.tahunAjaran && <Field label="Tahun Ajaran" value={data.tahunAjaran} />}
      </div>

      <Section title="Tujuan Pembelajaran">
        <p className="whitespace-pre-wrap text-sm">{data.tujuanPembelajaran}</p>
      </Section>

      <Section title="Kegiatan Pembelajaran">
        <ol className="space-y-2">
          {data.pertemuan.map((p) => (
            <li key={p.urutan} className="text-sm">
              <div className="font-semibold text-slate-700">Pertemuan {p.urutan}</div>
              <p className="whitespace-pre-wrap">{p.isiKegiatan}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Penilaian">
        {data.penilaian ? (
          <div className="space-y-2 text-sm">
            <SubField label="Pengetahuan" value={data.penilaian.pengetahuan} />
            <SubField label="Keterampilan" value={data.penilaian.keterampilan} />
            <SubField label="Sikap" value={data.penilaian.sikap} />
          </div>
        ) : (
          <p className="text-slate-400 text-sm">—</p>
        )}
      </Section>

      <Section title="Pengesahan">
        <div className="grid grid-cols-3 gap-4 text-sm text-center">
          <div>
            <div className="text-slate-500">Mengetahui,</div>
            <div className="text-slate-500">Kepala Sekolah</div>
            <div className="h-12" />
            <div className="font-semibold border-t border-slate-300 pt-1">{data.namaKepalaSekolah ?? "—"}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Tempat &amp; Tanggal</div>
            <div className="h-12 flex items-center justify-center">{data.tempat ?? "Purbalingga"},<br />{fmtTanggal(data.tanggalPengesahan)}</div>
          </div>
          <div>
            <div className="text-slate-500">Guru Pengampu</div>
            <div className="h-12" />
            <div className="font-semibold border-t border-slate-300 pt-1">{data.namaUstadz}</div>
          </div>
        </div>
      </Section>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="font-semibold text-slate-600 w-40 shrink-0">{label}</span>
      <span className="text-slate-800">: {value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-semibold text-emerald-800 mb-2 border-l-4 border-emerald-600 pl-2">{title}</h3>
      <div className="pl-2">{children}</div>
    </section>
  );
}

function SubField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-semibold text-slate-600">{label}</div>
      <p className="whitespace-pre-wrap">{value}</p>
    </div>
  );
}