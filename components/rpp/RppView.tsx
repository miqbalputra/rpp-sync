// Tampilan RPP (read-only) — layout tabel berborder meniru format rpp.pdf.
// Dipakai di halaman detail, referensi, & export gambar/PDF (export pakai
// template HTML terpisah, komponen ini untuk tampilan web).
export type RppViewData = {
  noRpp?: string | null;
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

// Helper kelas tabel agar konsisten.
const cellCls = "border border-slate-400 px-2.5 py-1.5 text-sm text-slate-800 align-top";
const labelCls = "border border-slate-400 px-2.5 py-1.5 text-sm font-semibold text-slate-700 bg-slate-50 align-top w-36";
const sectionHeaderCls = "border border-slate-400 px-2.5 py-1.5 text-sm font-bold text-emerald-800 bg-emerald-50 text-center";

// Wrapper styling untuk halaman web (export pakai RppTemplateExport terpisah).
export function RppView({ data }: { data: RppViewData }) {
  const kelasSemester = `${data.kelasNama}${data.semester ? ` / ${data.semester}` : ""}`;

  // Pertemuan disusun 2 per baris (meniru layout rpp.pdf: Pertemuan 1|2, 3|4, ...).
  const pertemuanRows: { urutan: number; isiKegiatan: string }[][] = [];
  for (let i = 0; i < data.pertemuan.length; i += 2) {
    pertemuanRows.push(data.pertemuan.slice(i, i + 2));
  }

  return (
    <article className="text-slate-800">
      {/* Judul */}
      <header className="border-2 border-emerald-700 px-3 py-2 mb-3">
        <div className="text-center font-bold text-base uppercase tracking-wide">
          Rencana Pelaksanaan Pembelajaran
        </div>
        {data.noRpp && (
          <div className="text-center text-xs text-slate-600 mt-0.5">
            No. RPP: <span className="font-semibold">{data.noRpp}</span>
          </div>
        )}
      </header>

      {/* Meta: 4 kolom (label | value | label | value) */}
      <table className="w-full border-collapse mb-3">
        <tbody>
          <tr>
            <th className={labelCls}>Mata Pelajaran</th>
            <td className={cellCls}>{data.mapelNama}</td>
            <th className={labelCls}>Materi</th>
            <td className={cellCls}>{data.materi}</td>
          </tr>
          <tr>
            <th className={labelCls}>Kelas / Semester</th>
            <td className={cellCls}>{kelasSemester}</td>
            <th className={labelCls}>Alokasi Waktu</th>
            <td className={cellCls}>{data.alokasiWaktu}</td>
          </tr>
          {data.tahunAjaran && (
            <tr>
              <th className={labelCls}>Tahun Ajaran</th>
              <td className={cellCls} colSpan={3}>{data.tahunAjaran}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Tujuan Pembelajaran */}
      <table className="w-full border-collapse mb-3">
        <tbody>
          <tr>
            <th className={sectionHeaderCls}>Tujuan Pembelajaran</th>
          </tr>
          <tr>
            <td className={cellCls + " min-h-[60px]"}>
              <p className="whitespace-pre-wrap">{data.tujuanPembelajaran}</p>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Kegiatan Pembelajaran — pertemuan 2 per baris */}
      <table className="w-full border-collapse mb-3">
        <tbody>
          <tr>
            <th className={sectionHeaderCls} colSpan={2}>Kegiatan Pembelajaran</th>
          </tr>
          {pertemuanRows.map((row, ri) => (
            <tr key={ri}>
              {row.map((p) => (
                <td key={p.urutan} className={cellCls + " w-1/2"}>
                  <div className="font-semibold text-slate-700 mb-1">Pertemuan {p.urutan}</div>
                  <p className="whitespace-pre-wrap">{p.isiKegiatan}</p>
                </td>
              ))}
              {row.length === 1 && <td className={cellCls + " bg-slate-50"}>&nbsp;</td>}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Penilaian — 3 kolom */}
      <table className="w-full border-collapse mb-3">
        <tbody>
          <tr>
            <th className={sectionHeaderCls}>Pengetahuan</th>
            <th className={sectionHeaderCls}>Keterampilan</th>
            <th className={sectionHeaderCls}>Sikap</th>
          </tr>
          <tr>
            <td className={cellCls}>
              <p className="whitespace-pre-wrap">{data.penilaian?.pengetahuan ?? "—"}</p>
            </td>
            <td className={cellCls}>
              <p className="whitespace-pre-wrap">{data.penilaian?.keterampilan ?? "—"}</p>
            </td>
            <td className={cellCls}>
              <p className="whitespace-pre-wrap">{data.penilaian?.sikap ?? "—"}</p>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Pengesahan — 3 kolom */}
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className={cellCls + " text-center w-1/3"}>
              <div className="text-slate-600">Mengetahui,</div>
              <div className="text-slate-600">Kepala Sekolah</div>
              <div className="h-12" />
              <div className="font-semibold border-t border-slate-400 pt-1">
                {data.namaKepalaSekolah ?? "—"}
              </div>
            </td>
            <td className={cellCls + " text-center w-1/3"}>
              <div className="text-slate-400 text-xs">Tempat &amp; Tanggal</div>
              <div className="h-12 flex items-center justify-center">
                {data.tempat ?? "Purbalingga"},<br />{fmtTanggal(data.tanggalPengesahan)}
              </div>
            </td>
            <td className={cellCls + " text-center w-1/3"}>
              <div className="text-slate-600">Ustadz/ah Pengampu</div>
              <div className="h-12" />
              <div className="font-semibold border-t border-slate-400 pt-1">{data.namaUstadz}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}