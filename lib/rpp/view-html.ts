// Sumber HTML bersama untuk BODY RPP (judul + tabel-tabel). Dipakai oleh:
//   - components/rpp/RppView.tsx (tampilan layar, via dangerouslySetInnerHTML)
//   - lib/rpp/template.ts       (export gambar/PDF via Puppeteer)
// Tujuan: export SAMA PERSIS dengan yang tampil di layar. Inline-style dipakai
// agar tidak bergantung pada Tailwind (Puppeteer merender HTML standalone).
import { RppViewData } from "@/components/rpp/RppView";

// Palet = padanan kelas Tailwind di RppView lama (slate-800/700/50, emerald-700/800/50, slate-400).
const C = {
  text: "#1e293b", // slate-800
  border: "#94a3b8", // slate-400
  labelBg: "#f8fafc", // slate-50
  labelText: "#334155", // slate-700
  headerText: "#065f46", // emerald-800
  headerBg: "#ecfdf5", // emerald-50
  titleBorder: "#047857", // emerald-700
  muted: "#475569", // slate-600
  mutedLight: "#94a3b8", // slate-400
} as const;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fmtTanggal(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  try {
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
  } catch {
    return "";
  }
}

// Gaya sel (padanan kelas di RppView.tsx).
const TABLE = `width:100%;border-collapse:collapse;margin-bottom:12px;`;
const CELL = `border:1px solid ${C.border};padding:6px 10px;font-size:14px;color:${C.text};vertical-align:top;white-space:pre-wrap;`;
const LABEL = CELL + `background:${C.labelBg};font-weight:600;color:${C.labelText};text-align:left;width:144px;white-space:normal;`;
const SECTION_HEADER = `border:1px solid ${C.border};padding:6px 10px;font-size:14px;font-weight:700;color:${C.headerText};background:${C.headerBg};text-align:center;`;

/**
 * HTML body RPP (isi <article>). Identik strukturnya dengan RppView.tsx:
 * header judul + No. RPP, tabel meta 4-kolom, tabel tujuan, tabel kegiatan
 * (pertemuan 2 per baris), tabel penilaian 3-kolom, tabel pengesahan 3-kolom.
 */
export function rppBodyHtml(data: RppViewData): string {
  const kelasSemester = `${esc(data.kelasNama)}${data.semester ? " / " + esc(data.semester) : ""}`;

  // Pertemuan disusun 2 per baris (meniru layout rpp.pdf: Pertemuan 1|2, 3|4, ...).
  const rows: { urutan: number; isiKegiatan: string; tanggal?: string | Date | null }[][] = [];
  for (let i = 0; i < data.pertemuan.length; i += 2) {
    rows.push(data.pertemuan.slice(i, i + 2));
  }

  // ----- Header (judul + No. RPP + penanda AI) -----
  const noRppLine = data.noRpp
    ? `<div style="text-align:center;font-size:12px;color:${C.muted};margin-top:2px;">No. RPP: <strong style="font-weight:600;">${esc(data.noRpp)}</strong></div>`
    : "";
  const aiLine = data.dibuatDenganAI
    ? `<div style="text-align:center;font-size:11px;color:${C.headerText};margin-top:2px;font-style:italic;">✦ Dibantu AI</div>`
    : "";
  const header = `<div style="border:2px solid ${C.titleBorder};padding:8px 12px;margin-bottom:12px;">
    <div style="text-align:center;font-weight:700;font-size:16px;text-transform:uppercase;letter-spacing:0.05em;color:${C.text};">Rencana Pelaksanaan Pembelajaran</div>
    ${noRppLine}${aiLine}
  </div>`;

  // ----- Tabel meta (4 kolom: label | value | label | value) -----
  const meta = `<table style="${TABLE}"><tbody>
    <tr>
      <td style="${LABEL}">Mata Pelajaran</td>
      <td style="${CELL}">${esc(data.mapelNama)}</td>
      <td style="${LABEL}">Materi</td>
      <td style="${CELL}">${esc(data.materi)}</td>
    </tr>
    <tr>
      <td style="${LABEL}">Kelas / Semester</td>
      <td style="${CELL}">${kelasSemester}</td>
      <td style="${LABEL}">Alokasi Waktu</td>
      <td style="${CELL}">${esc(data.alokasiWaktu)}</td>
    </tr>
    ${data.tahunAjaran ? `<tr><td style="${LABEL}">Tahun Ajaran</td><td style="${CELL}" colspan="3">${esc(data.tahunAjaran)}</td></tr>` : ""}
  </tbody></table>`;

  // ----- Tabel Tujuan Pembelajaran -----
  const tujuan = `<table style="${TABLE}"><tbody>
    <tr><td style="${SECTION_HEADER}">Tujuan Pembelajaran</td></tr>
    <tr><td style="${CELL}min-height:60px;">${esc(data.tujuanPembelajaran)}</td></tr>
  </tbody></table>`;

  // ----- Tabel Kegiatan Pembelajaran (pertemuan 2 per baris) -----
  const pertemuanRows = rows
    .map((row) => {
      const cells = row
        .map(
          (p) => `<td style="${CELL}width:50%;">
            <div style="font-weight:600;color:${C.labelText};margin-bottom:4px;">Pertemuan ${p.urutan}</div>
            ${p.tanggal ? `<div style="font-size:12px;color:${C.muted};margin-bottom:4px;">Tanggal KBM: ${esc(fmtTanggal(p.tanggal))}</div>` : ""}
            <div style="white-space:pre-wrap;">${esc(p.isiKegiatan)}</div>
          </td>`
        )
        .join("");
      const filler = row.length === 1 ? `<td style="${CELL}background:${C.labelBg};">&nbsp;</td>` : "";
      return `<tr>${cells}${filler}</tr>`;
    })
    .join("");
  const kegiatan = `<table style="${TABLE}"><tbody>
    <tr><td style="${SECTION_HEADER}" colspan="2">Kegiatan Pembelajaran</td></tr>
    ${pertemuanRows}
  </tbody></table>`;

  // ----- Tabel Penilaian (3 kolom) -----
  const pen = data.penilaian;
  const penilaian = `<table style="${TABLE}"><tbody>
    <tr>
      <td style="${SECTION_HEADER}">Pengetahuan</td>
      <td style="${SECTION_HEADER}">Keterampilan</td>
      <td style="${SECTION_HEADER}">Sikap</td>
    </tr>
    <tr>
      <td style="${CELL}">${esc(pen?.pengetahuan ?? "—")}</td>
      <td style="${CELL}">${esc(pen?.keterampilan ?? "—")}</td>
      <td style="${CELL}">${esc(pen?.sikap ?? "—")}</td>
    </tr>
  </tbody></table>`;

  // ----- Tabel Pengesahan (3 kolom) -----
  const pengesahan = `<table style="${TABLE}margin-bottom:0;"><tbody><tr>
    <td style="${CELL}text-align:center;width:33.33%;">
      <div style="color:${C.muted};">Mengetahui,</div>
      <div style="color:${C.muted};">Kepala Sekolah</div>
      <div style="height:48px;"></div>
      <div style="font-weight:600;border-top:1px solid ${C.border};padding-top:4px;">${esc(data.namaKepalaSekolah ?? "—")}</div>
    </td>
    <td style="${CELL}text-align:center;width:33.33%;">
      <div style="color:${C.mutedLight};font-size:12px;">Tempat &amp; Tanggal</div>
      <div style="height:48px;display:flex;align-items:center;justify-content:center;">${esc(data.tempat ?? "Purbalingga")},<br/>${esc(fmtTanggal(data.tanggalPengesahan))}</div>
    </td>
    <td style="${CELL}text-align:center;width:33.33%;">
      <div style="color:${C.muted};">Ustadz/ah Pengampu</div>
      <div style="height:48px;"></div>
      <div style="font-weight:600;border-top:1px solid ${C.border};padding-top:4px;">${esc(data.namaUstadz)}</div>
    </td>
  </tr></tbody></table>`;

  return `<div style="color:${C.text};font-size:14px;">${header}${meta}${tujuan}${kegiatan}${penilaian}${pengesahan}</div>`;
}