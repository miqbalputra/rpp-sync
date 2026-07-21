// Template HTML RPP untuk export gambar/PDF (Puppeteer).
// Body di-generate dari sumber tunggal lib/rpp/view-html.ts — SAMA PERSIS dengan
// tampilan layar (components/rpp/RppView.tsx). File ini hanya membungkus body
// dengan halaman A4 + font sans (mengikuti font UI layar).
import { RppViewData } from "@/components/rpp/RppView";
import { rppBodyHtml } from "@/lib/rpp/view-html";

export function buildRppHtml(data: RppViewData): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    margin: 0;
    padding: 0;
    width: 794px; /* ~A4 @96dpi */
  }
  table { border-spacing: 0; }
</style>
</head>
<body>
  ${rppBodyHtml(data)}
</body>
</html>`;
}