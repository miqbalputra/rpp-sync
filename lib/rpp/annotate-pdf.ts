import {
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFString,
  StandardFonts,
  rgb,
} from "pdf-lib";

type PromesPdfInfo = {
  mapelNama: string;
  kelasNama: string;
  promesUrl: string;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const URL_LINE_LENGTH = 72;

function splitUrl(url: string): string[] {
  const lines: string[] = [];
  for (let index = 0; index < url.length; index += URL_LINE_LENGTH) {
    lines.push(url.slice(index, index + URL_LINE_LENGTH));
  }
  return lines.length > 0 ? lines : [url];
}

function addExternalLink(
  document: PDFDocument,
  page: ReturnType<PDFDocument["addPage"]>,
  url: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const annotation = document.context.obj({
    Type: PDFName.of("Annot"),
    Subtype: PDFName.of("Link"),
    Rect: document.context.obj([
      PDFNumber.of(x),
      PDFNumber.of(y),
      PDFNumber.of(x + width),
      PDFNumber.of(y + height),
    ]),
    Border: document.context.obj([0, 0, 0]),
    A: document.context.obj({
      Type: PDFName.of("Action"),
      S: PDFName.of("URI"),
      URI: PDFString.of(url),
    }),
  });

  page.node.addAnnot(document.context.register(annotation));
}

export async function addPromesPageToPdf(
  source: Uint8Array,
  info: PromesPdfInfo,
): Promise<Uint8Array> {
  const document = await PDFDocument.load(source);
  const page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await document.embedFont(StandardFonts.Helvetica);
  const boldFont = await document.embedFont(StandardFonts.HelveticaBold);
  const linkColor = rgb(0.12, 0.25, 0.82);

  page.drawText("Referensi Program Semester (Promes)", {
    x: MARGIN,
    y: PAGE_HEIGHT - 80,
    font: boldFont,
    size: 20,
    color: rgb(0.06, 0.1, 0.2),
  });
  page.drawText("RPP ini dilengkapi tautan Promes yang ditetapkan untuk pasangan Mapel dan Kelas.", {
    x: MARGIN,
    y: PAGE_HEIGHT - 112,
    font,
    size: 10,
    color: rgb(0.25, 0.29, 0.38),
  });
  page.drawText(`Mapel: ${info.mapelNama}`, {
    x: MARGIN,
    y: PAGE_HEIGHT - 168,
    font,
    size: 13,
    color: rgb(0.06, 0.1, 0.2),
  });
  page.drawText(`Kelas: ${info.kelasNama}`, {
    x: MARGIN,
    y: PAGE_HEIGHT - 192,
    font,
    size: 13,
    color: rgb(0.06, 0.1, 0.2),
  });
  page.drawText("Lihat Promes:", {
    x: MARGIN,
    y: PAGE_HEIGHT - 248,
    font: boldFont,
    size: 12,
    color: rgb(0.06, 0.1, 0.2),
  });

  const urlLines = splitUrl(info.promesUrl);
  const urlStartY = PAGE_HEIGHT - 276;
  const lineHeight = 16;
  urlLines.forEach((line, index) => {
    page.drawText(line, {
      x: MARGIN,
      y: urlStartY - index * lineHeight,
      font,
      size: 10,
      color: linkColor,
    });
  });
  addExternalLink(
    document,
    page,
    info.promesUrl,
    MARGIN,
    urlStartY - (urlLines.length - 1) * lineHeight - 4,
    PAGE_WIDTH - MARGIN * 2,
    urlLines.length * lineHeight,
  );

  return document.save();
}
