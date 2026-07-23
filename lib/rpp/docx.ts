// Generate file Word (.docx) dari data RPP. Struktur meniru layout tabel di
// layar (components/rpp/RppView.tsx & lib/rpp/view-html.ts) agar hasil export
// Word SAMA PERSIS dengan tampilan layar: judul + No. RPP, tabel meta 4-kolom,
// tujuan, kegiatan (pertemuan 2 per baris), penilaian 3-kolom, pengesahan 3-kolom.
import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, VerticalAlign,
} from "docx";
import { RppViewData } from "@/components/rpp/RppView";

function fmtTanggal(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  try {
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
  } catch {
    return "";
  }
}

// Padanan warna slate/emerald dari RppView.
const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" }; // slate-400, 0.5pt
const CELL_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

function txt(text: string, opts: { bold?: boolean; italics?: boolean; color?: string; size?: number } = {}): TextRun {
  return new TextRun({ text, bold: opts.bold, italics: opts.italics, color: opts.color, size: opts.size ?? 22 }); // 11pt
}

// Sel biasa (value).
function vCell(text: string, opts: { widthPct?: number; columnSpan?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}): TableCell {
  const lines = String(text ?? "").split("\n");
  return new TableCell({
    width: opts.widthPct ? { size: opts.widthPct, type: WidthType.PERCENTAGE } : undefined,
    columnSpan: opts.columnSpan,
    verticalAlign: VerticalAlign.TOP,
    borders: CELL_BORDERS,
    children: lines.map((l) => new Paragraph({ alignment: opts.align, spacing: { after: 0 }, children: [txt(l)] })),
  });
}

// Sel label (tebal, latar slate-50, rata kiri).
function lCell(text: string, widthPct: number): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.TOP,
    borders: CELL_BORDERS,
    shading: { type: ShadingType.CLEAR, color: "auto", fill: "F8FAFC" }, // slate-50
    children: [new Paragraph({ spacing: { after: 0 }, children: [txt(text, { bold: true, color: "334155" })] })], // slate-700
  });
}

// Sel header section (tebal, latar emerald-50, rata tengah).
function hCell(text: string, columnSpan?: number): TableCell {
  return new TableCell({
    columnSpan,
    verticalAlign: VerticalAlign.TOP,
    borders: CELL_BORDERS,
    shading: { type: ShadingType.CLEAR, color: "auto", fill: "ECFDF5" }, // emerald-50
    children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [txt(text, { bold: true, color: "065F46" })] })], // emerald-800
  });
}

const FULL = { size: 100, type: WidthType.PERCENTAGE };

export async function buildRppDocxBuffer(data: RppViewData): Promise<Buffer> {
  const kelasSemester = `${data.kelasNama}${data.semester ? " / " + data.semester : ""}`;

  // ----- Judul + No. RPP -----
  const judul: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: "RENCANA PELAKSANAAN PEMBELAJARAN", bold: true, size: 28 })], // 14pt
    }),
  ];
  if (data.noRpp) {
    judul.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: data.dibuatDenganAI ? 0 : 120 },
        children: [new TextRun({ text: `No. RPP: `, size: 20 }), new TextRun({ text: data.noRpp, bold: true, size: 20 })], // 10pt
      })
    );
  } else {
    judul.push(new Paragraph({ spacing: { after: data.dibuatDenganAI ? 0 : 120 }, children: [] }));
  }
  if (data.dibuatDenganAI) {
    judul.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: "✦ Dibantu AI", italics: true, color: "065F46", size: 20 })], // emerald-800, 10pt
      })
    );
  }

  // ----- Tabel meta (4 kolom) -----
  const meta = new Table({
    width: FULL,
    rows: [
      new TableRow({ children: [lCell("Mata Pelajaran", 25), vCell(data.mapelNama, { widthPct: 25 }), lCell("Materi", 25), vCell(data.materi, { widthPct: 25 })] }),
      new TableRow({ children: [lCell("Kelas / Semester", 25), vCell(kelasSemester, { widthPct: 25 }), lCell("Alokasi Waktu", 25), vCell(data.alokasiWaktu, { widthPct: 25 })] }),
      ...(data.tahunAjaran ? [new TableRow({ children: [lCell("Tahun Ajaran", 25), vCell(data.tahunAjaran, { columnSpan: 3 })] })] : []),
    ],
  });

  // ----- Tujuan Pembelajaran -----
  const tujuan = new Table({
    width: FULL,
    rows: [
      new TableRow({ children: [hCell("Tujuan Pembelajaran")] }),
      new TableRow({ children: [vCell(data.tujuanPembelajaran)] }),
    ],
  });

  // ----- Kegiatan Pembelajaran (pertemuan 2 per baris) -----
  const pRows: { urutan: number; isiKegiatan: string; tanggal?: string | Date | null }[][] = [];
  for (let i = 0; i < data.pertemuan.length; i += 2) pRows.push(data.pertemuan.slice(i, i + 2));
  const kegiatanRows: TableRow[] = [
    new TableRow({ children: [hCell("Kegiatan Pembelajaran", 2)] }),
    ...pRows.map((row) => {
      const cells = row.map((p) =>
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.TOP,
          borders: CELL_BORDERS,
          children: [
            new Paragraph({ spacing: { after: 40 }, children: [txt(`Pertemuan ${p.urutan}`, { bold: true, color: "334155" })] }),
            ...(p.tanggal
              ? [new Paragraph({ spacing: { after: 40 }, children: [txt(`Tanggal KBM: ${fmtTanggal(p.tanggal)}`, { color: "475569", italics: true })] })]
              : []),
            ...String(p.isiKegiatan).split("\n").map((l) => new Paragraph({ spacing: { after: 0 }, children: [txt(l)] })),
          ],
        })
      );
      if (row.length === 1) {
        cells.push(new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: CELL_BORDERS, children: [new Paragraph({ children: [] })] }));
      }
      return new TableRow({ children: cells });
    }),
  ];
  const kegiatan = new Table({ width: FULL, rows: kegiatanRows });

  // ----- Penilaian (3 kolom) -----
  const pen = data.penilaian;
  const penilaian = new Table({
    width: FULL,
    rows: [
      new TableRow({ children: [hCell("Pengetahuan"), hCell("Keterampilan"), hCell("Sikap")] }),
      new TableRow({ children: [vCell(pen?.pengetahuan ?? "—"), vCell(pen?.keterampilan ?? "—"), vCell(pen?.sikap ?? "—")] }),
    ],
  });

  // ----- Pengesahan (3 kolom) -----
  const spacer = (n = 3) => Array.from({ length: n }, () => new Paragraph({ spacing: { after: 0 }, children: [txt("")] }));
  const pengesahan = new Table({
    width: FULL,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE }, borders: CELL_BORDERS,
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [txt("Mengetahui,", { color: "475569" })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [txt("Kepala Sekolah", { color: "475569" })] }),
              ...spacer(),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [txt(data.namaKepalaSekolah ?? "—", { bold: true })] }),
            ],
          }),
          new TableCell({
            width: { size: 34, type: WidthType.PERCENTAGE }, borders: CELL_BORDERS,
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [txt("Tempat & Tanggal", { color: "94A3B8", size: 20 })] }),
              ...spacer(),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [txt(`${data.tempat ?? "Purbalingga"}, ${fmtTanggal(data.tanggalPengesahan)}`, { bold: true })] }),
            ],
          }),
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE }, borders: CELL_BORDERS,
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [txt("Ustadz/ah Pengampu", { color: "475569" })] }),
              ...spacer(),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [txt(data.namaUstadz, { bold: true })] }),
            ],
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        children: [
          ...judul,
          meta,
          new Paragraph({ spacing: { after: 80 }, children: [] }),
          tujuan,
          new Paragraph({ spacing: { after: 80 }, children: [] }),
          kegiatan,
          new Paragraph({ spacing: { after: 80 }, children: [] }),
          penilaian,
          new Paragraph({ spacing: { after: 80 }, children: [] }),
          pengesahan,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}