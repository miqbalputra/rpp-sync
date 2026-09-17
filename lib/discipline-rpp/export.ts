import puppeteer from "puppeteer";
import type { RppDisciplineReport } from "./queries";
import { buildRppDisciplineReportHtml } from "./report-html";

export type RppDisciplineExportFormat = "pdf" | "image";

export const RPP_DISCIPLINE_EXPORT_MIME: Record<RppDisciplineExportFormat, string> = {
  pdf: "application/pdf",
  image: "image/png",
};

export const RPP_DISCIPLINE_EXPORT_EXTENSION: Record<RppDisciplineExportFormat, string> = {
  pdf: "pdf",
  image: "png",
};

export async function renderRppDisciplineReport(
  report: RppDisciplineReport,
  format: RppDisciplineExportFormat,
) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1.5 });
    await page.setContent(buildRppDisciplineReportHtml(report), { waitUntil: "load" });

    if (format === "pdf") {
      const pdf = await page.pdf({
        format: "A4",
        landscape: true,
        printBackground: true,
        margin: { top: "11mm", bottom: "11mm", left: "11mm", right: "11mm" },
      });
      return Buffer.from(pdf);
    }

    const image = await page.screenshot({ type: "png", fullPage: true });
    return Buffer.from(image);
  } finally {
    await browser.close();
  }
}
