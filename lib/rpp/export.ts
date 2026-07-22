// Generate export gambar (PNG) & PDF via Puppeteer, dengan cache di RppExport (PRD Tahap 7).
import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import puppeteer from "puppeteer";
import { prisma } from "@/lib/db";
import { RppViewData } from "@/components/rpp/RppView";
import { buildRppHtml } from "@/lib/rpp/template";
import { buildRppDocxBuffer } from "@/lib/rpp/docx";

const EXPORT_DIR = join(process.cwd(), "public", "exports");

export type ExportTipe = "IMAGE" | "PDF" | "DOCX";

export const MIME: Record<ExportTipe, string> = {
  IMAGE: "image/png",
  PDF: "application/pdf",
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};
export const EXT: Record<ExportTipe, string> = {
  IMAGE: "png",
  PDF: "pdf",
  DOCX: "docx",
};

// Versi template render. Naikkan kalau layout export berubah signifikan
// (mis. ganti template.ts/docx.ts/view-html.ts) supaya cache lama ter-invalidate
// dan file di-regenerate dengan layout baru.
const RENDER_VERSION = "v3-2026-07";

/** Hash konten RPP untuk invalidasi cache (PRD: regenerate kalau RPP diedit). */
export function contentHash(data: RppViewData): string {
  const parts = [
    RENDER_VERSION,
    data.noRpp ?? "",
    data.dibuatDenganAI ? "ai" : "",
    data.mapelNama,
    data.kelasNama,
    data.materi,
    data.alokasiWaktu,
    data.tujuanPembelajaran,
    data.tanggalPengesahan.toString(),
    data.namaUstadz,
    data.namaKepalaSekolah ?? "",
    data.tempat ?? "",
    data.pertemuan.map((p) => p.isiKegiatan).join("\n"),
    data.penilaian ? [data.penilaian.pengetahuan, data.penilaian.keterampilan, data.penilaian.sikap].join("|") : "",
  ];
  return createHash("sha1").update(parts.join("§§")).digest("hex").slice(0, 16);
}

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
}

/** Generate file (gambar atau pdf) ke disk, kembalikan path relatif & absolut. */
async function generateFile(
  html: string,
  tipe: ExportTipe,
  rppId: string,
  hash: string
): Promise<{ relPath: string; absPath: string }> {
  const dir = join(EXPORT_DIR, rppId);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  const filename = `${tipe.toLowerCase()}-${hash}.${EXT[tipe]}`;
  const absPath = join(dir, filename);
  const relPath = `/exports/${rppId}/${filename}`;

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    if (tipe === "IMAGE") {
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
      await page.screenshot({ path: absPath, type: "png", fullPage: true });
    } else {
      await page.pdf({
        path: absPath,
        format: "A4",
        printBackground: true,
        margin: { top: "14mm", bottom: "14mm", left: "12mm", right: "12mm" },
      });
    }
  } finally {
    await browser.close();
  }

  return { relPath, absPath };
}

/** Generate file Word (.docx) — tanpa browser. */
async function generateWordFile(
  data: RppViewData,
  rppId: string,
  hash: string
): Promise<{ relPath: string; absPath: string }> {
  const dir = join(EXPORT_DIR, rppId);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  const filename = `word-${hash}.docx`;
  const absPath = join(dir, filename);
  const relPath = `/exports/${rppId}/${filename}`;
  const buf = await buildRppDocxBuffer(data);
  await writeFile(absPath, buf);
  return { relPath, absPath };
}

/** Ambil/ciptakan file export (cache berbasis hash). Kembalikan path relatif & absolut. */
export async function getOrCreateExport(
  rppId: string,
  data: RppViewData,
  tipe: ExportTipe
): Promise<{ relPath: string; absPath: string; mime: string }> {
  const hash = contentHash(data);

  // Cek cache
  const cached = await prisma.rppExport.findUnique({
    where: { rppId_tipeFile: { rppId, tipeFile: tipe } },
  });
  if (cached && cached.hash === hash && existsSync(join(process.cwd(), cached.pathFile))) {
    return { relPath: cached.pathFile, absPath: join(process.cwd(), cached.pathFile), mime: MIME[tipe] };
  }

  // Generate baru
  const { relPath, absPath } =
    tipe === "DOCX"
      ? await generateWordFile(data, rppId, hash)
      : await generateFile(buildRppHtml(data), tipe, rppId, hash);

  // Upsert cache
  await prisma.rppExport.upsert({
    where: { rppId_tipeFile: { rppId, tipeFile: tipe } },
    create: { rppId, tipeFile: tipe, pathFile: relPath, hash },
    update: { pathFile: relPath, hash },
  });

  return { relPath, absPath, mime: MIME[tipe] };
}