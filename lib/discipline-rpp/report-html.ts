import type { RppDisciplineEntry, RppDisciplineReport } from "./queries";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(value);
}

function statusLabel(entry: RppDisciplineEntry) {
  if (entry.status === "LENGKAP") return "Sudah lengkap";
  if (entry.status === "TANPA_PENUGASAN") return "Belum ada penugasan";
  return "Belum lengkap";
}

function statusClass(entry: RppDisciplineEntry) {
  if (entry.status === "LENGKAP") return "success";
  if (entry.status === "TANPA_PENUGASAN") return "muted";
  return "warning";
}

function missingHtml(entry: RppDisciplineEntry) {
  if (entry.missing.length === 0) return "<span class=\"muted\">-</span>";
  return entry.missing
    .map((item) => `${escapeHtml(item.mapel)} - ${escapeHtml(item.kelas)} (${item.gender === "IKHWAN" ? "Ikhwan" : "Akhwat"})`)
    .join("<br />");
}

export function buildRppDisciplineReportHtml(data: RppDisciplineReport): string {
  const leaderboardRows = data.leaderboard.slice(0, 10).map((entry) => `
    <tr>
      <td class="rank">${entry.rank}</td>
      <td><strong>${escapeHtml(entry.namaGuru)}</strong></td>
      <td>${entry.rppSudahDibuat}/${entry.totalPenugasan}</td>
      <td><div class="progress"><span style="width:${entry.persentase ?? 0}%"></span></div><small>${entry.persentase ?? 0}%</small></td>
      <td><span class="badge ${statusClass(entry)}">${statusLabel(entry)}</span></td>
    </tr>`).join("");

  const detailRows = data.entries.map((entry) => `
    <tr>
      <td class="rank">${entry.rank ?? "-"}</td>
      <td><strong>${escapeHtml(entry.namaGuru)}</strong></td>
      <td>${entry.totalPenugasan}</td>
      <td>${entry.rppSudahDibuat}</td>
      <td>${entry.rppBelumDibuat}</td>
      <td>${entry.persentase === null ? "-" : `${entry.persentase}%`}</td>
      <td><span class="badge ${statusClass(entry)}">${statusLabel(entry)}</span></td>
      <td class="missing">${missingHtml(entry)}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4 landscape; margin: 11mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #0f172a; font-family: Arial, Helvetica, sans-serif; font-size: 10px; background: #ffffff; }
  .header { border-radius: 16px; padding: 24px 28px; color: #ffffff; background: linear-gradient(120deg, #1d4ed8, #4f46e5); }
  .eyebrow { font-size: 10px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; color: #bfdbfe; }
  h1 { margin: 6px 0 3px; font-size: 25px; line-height: 1.15; }
  .header p { margin: 0; color: #dbeafe; font-size: 11px; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 16px 0; }
  .card { min-height: 76px; border: 1px solid #dbeafe; border-radius: 12px; padding: 12px; background: #f8fbff; }
  .card .value { display: block; color: #1d4ed8; font-size: 24px; font-weight: 800; line-height: 1; }
  .card .label { display: block; margin-top: 6px; color: #475569; font-size: 10px; }
  .notice { margin: 16px 0; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 11px 13px; background: #fffbeb; color: #78350f; font-size: 10px; line-height: 1.5; }
  h2 { margin: 20px 0 8px; color: #1e3a8a; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; }
  th { padding: 8px; color: #475569; background: #eff6ff; border: 1px solid #dbeafe; font-size: 9px; text-align: left; text-transform: uppercase; letter-spacing: .04em; }
  td { padding: 8px; vertical-align: top; border: 1px solid #e2e8f0; line-height: 1.35; }
  tr:nth-child(even) td { background: #f8fafc; }
  .rank { width: 28px; color: #1d4ed8; font-weight: 800; text-align: center; }
  .missing { min-width: 180px; color: #334155; }
  .badge { display: inline-block; border-radius: 999px; padding: 3px 7px; font-size: 8px; font-weight: 700; white-space: nowrap; }
  .badge.success { color: #166534; background: #dcfce7; }
  .badge.warning { color: #92400e; background: #fef3c7; }
  .badge.muted { color: #475569; background: #e2e8f0; }
  .progress { display: inline-block; width: 82px; height: 6px; margin-right: 5px; overflow: hidden; border-radius: 99px; background: #dbeafe; vertical-align: middle; }
  .progress span { display: block; height: 100%; border-radius: inherit; background: #2563eb; }
  small, .muted { color: #64748b; }
  .footer { margin-top: 16px; color: #64748b; font-size: 9px; text-align: center; }
</style>
</head>
<body>
  <section class="header">
    <div class="eyebrow">Sinkronisasi RPP</div>
    <h1>Laporan Kedisiplinan Pembuatan RPP</h1>
    <p>Data penugasan aktif dan RPP aktif per ${formatDate(data.generatedAt)} WIB</p>
  </section>

  <section class="summary">
    <div class="card"><span class="value">${data.summary.guruLengkap}</span><span class="label">Guru dengan RPP lengkap</span></div>
    <div class="card"><span class="value">${data.summary.guruBelumLengkap}</span><span class="label">Guru perlu melengkapi RPP</span></div>
    <div class="card"><span class="value">${data.summary.penugasanSudahPunyaRpp}/${data.summary.totalPenugasan}</span><span class="label">Penugasan sudah memiliki RPP</span></div>
    <div class="card"><span class="value">${data.summary.penugasanBelumPunyaRpp}</span><span class="label">Penugasan belum memiliki RPP</span></div>
  </section>

  <section class="notice"><strong>Pengingat untuk Guru:</strong> Guru dengan status belum lengkap dimohon segera membuat atau mengunggah RPP sesuai penugasan Mapel dan Kelas. RPP draft tetap dihitung sebagai RPP yang telah dibuat.</section>

  <h2>Leaderboard Kedisiplinan RPP</h2>
  ${data.leaderboard.length === 0 ? "<p class=\"muted\">Belum ada guru dengan penugasan aktif untuk dinilai.</p>" : `<table><thead><tr><th>Peringkat</th><th>Guru</th><th>RPP</th><th>Kedisiplinan</th><th>Status</th></tr></thead><tbody>${leaderboardRows}</tbody></table>`}

  <h2>Rincian Seluruh Guru</h2>
  ${data.entries.length === 0 ? "<p class=\"muted\">Belum ada guru aktif.</p>" : `<table><thead><tr><th>Peringkat</th><th>Guru</th><th>Tugas</th><th>Sudah</th><th>Belum</th><th>Skor</th><th>Status</th><th>RPP yang Perlu Dilengkapi</th></tr></thead><tbody>${detailRows}</tbody></table>`}

  <div class="footer">Dibuat oleh aplikasi Sinkronisasi RPP - Muhammad Iqbal Putra / SchoolVia.id</div>
</body>
</html>`;
}
