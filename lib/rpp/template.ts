// Template HTML RPP untuk export gambar/PDF (PRD Tahap 7).
// LAYOUT PLACEHOLDER — menyesuaikan field §5.1. Akan disesuaikan setelah
// gambar template RPP asli tersedia dari user.
import { RppViewData } from "@/components/rpp/RppView";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function nl2br(s: string): string {
  return esc(s).replace(/\n/g, "<br/>");
}

function fmtTanggal(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  try {
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
  } catch {
    return "";
  }
}

export function buildRppHtml(data: RppViewData): string {
  const pertemuanRows = data.pertemuan
    .map(
      (p, i) => `
      <div class="pertemuan">
        <div class="pertemuan-judul">Pertemuan ${i + 1}</div>
        <div class="pertemuan-isi">${nl2br(p.isiKegiatan)}</div>
      </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Times New Roman", Georgia, serif;
    color: #1e293b;
    margin: 0;
    padding: 28px;
    width: 794px; /* ~A4 @96dpi */
  }
  .kop {
    text-align: center;
    border-bottom: 3px double #047857;
    padding-bottom: 10px;
    margin-bottom: 16px;
  }
  .kop .judul {
    font-size: 18px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .kop .sub { font-size: 13px; color: #475569; margin-top: 2px; }
  .kop .norpp { font-size: 12px; color: #334155; margin-top: 4px; }

  .meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 24px;
    font-size: 13px;
    margin-bottom: 14px;
  }
  .meta .row { display: flex; }
  .meta .label { font-weight: bold; width: 140px; flex-shrink: 0; color: #334155; }
  .meta .value { color: #0f172a; }

  .section { margin-top: 14px; }
  .section h2 {
    font-size: 13px;
    font-weight: bold;
    color: #047857;
    border-left: 4px solid #047857;
    padding-left: 8px;
    margin: 0 0 6px 0;
  }
  .section .isi { font-size: 13px; line-height: 1.5; padding-left: 12px; white-space: pre-wrap; }

  .pertemuan { margin-bottom: 8px; }
  .pertemuan-judul { font-weight: bold; font-size: 13px; color: #334155; }
  .pertemuan-isi { font-size: 13px; line-height: 1.5; padding-left: 12px; white-space: pre-wrap; }

  .penilaian-grid { display: grid; gap: 6px; padding-left: 12px; }
  .penilaian-item .lbl { font-weight: bold; color: #334155; font-size: 13px; }
  .penilaian-item .val { font-size: 13px; line-height: 1.5; white-space: pre-wrap; }

  .pengesahan {
    margin-top: 22px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
    text-align: center;
    font-size: 13px;
  }
  .pengesahan .col .role { color: #475569; }
  .pengesahan .col .nama {
    margin-top: 50px;
    font-weight: bold;
    border-top: 1px solid #334155;
    padding-top: 4px;
  }
  .pengesahan .col .ttgl { margin-top: 50px; }
  .footer { margin-top: 18px; font-size: 11px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
  <div class="kop">
    <div class="judul">Rencana Pelaksanaan Pembelajaran</div>
    <div class="sub">Griya Qur'an "Tunas Ilmu" — Purbalingga</div>
    ${data.noRpp ? `<div class="norpp">No. RPP: <strong>${esc(data.noRpp)}</strong></div>` : ""}
  </div>

  <div class="meta">
    <div class="row"><span class="label">Mata Pelajaran</span><span class="value">: ${esc(data.mapelNama)}</span></div>
    <div class="row"><span class="label">Kelas / Semester</span><span class="value">: ${esc(data.kelasNama)}${data.semester ? " / " + esc(data.semester) : ""}</span></div>
    <div class="row"><span class="label">Materi</span><span class="value">: ${esc(data.materi)}</span></div>
    <div class="row"><span class="label">Alokasi Waktu</span><span class="value">: ${esc(data.alokasiWaktu)}</span></div>
    ${data.tahunAjaran ? `<div class="row"><span class="label">Tahun Ajaran</span><span class="value">: ${esc(data.tahunAjaran)}</span></div>` : ""}
  </div>

  <div class="section">
    <h2>Tujuan Pembelajaran</h2>
    <div class="isi">${nl2br(data.tujuanPembelajaran)}</div>
  </div>

  <div class="section">
    <h2>Kegiatan Pembelajaran</h2>
    ${pertemuanRows}
  </div>

  <div class="section">
    <h2>Penilaian</h2>
    <div class="penilaian-grid">
      <div class="penilaian-item"><div class="lbl">Pengetahuan</div><div class="val">${data.penilaian ? nl2br(data.penilaian.pengetahuan) : "—"}</div></div>
      <div class="penilaian-item"><div class="lbl">Keterampilan</div><div class="val">${data.penilaian ? nl2br(data.penilaian.keterampilan) : "—"}</div></div>
      <div class="penilaian-item"><div class="lbl">Sikap</div><div class="val">${data.penilaian ? nl2br(data.penilaian.sikap) : "—"}</div></div>
    </div>
  </div>

  <div class="pengesahan">
    <div class="col">
      <div class="role">Mengetahui,<br/>Kepala Sekolah</div>
      <div class="nama">${data.namaKepalaSekolah ? esc(data.namaKepalaSekolah) : "................."}</div>
    </div>
    <div class="col">
      <div class="role">Tempat &amp; Tanggal</div>
      <div class="ttgl">${esc(data.tempat ?? "Purbalingga")},<br/>${fmtTanggal(data.tanggalPengesahan)}</div>
    </div>
    <div class="col">
      <div class="role">Guru Pengampu</div>
      <div class="nama">${esc(data.namaUstadz)}</div>
    </div>
  </div>

  <div class="footer">Dokumen ini digenerate otomatis oleh Aplikasi Sinkronisasi RPP.</div>
</body>
</html>`;
}