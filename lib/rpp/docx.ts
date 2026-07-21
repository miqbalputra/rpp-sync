// Generate file Word (.docx) dari data RPP — PRD Tahap 8, pakai library `docx`.
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } from "docx";
import { RppViewData } from "@/components/rpp/RppView";

function fmtTanggal(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  try {
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
  } catch {
    return "";
  }
}

function heading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, color: "047857" })],
    spacing: { before: 160, after: 60 },
  });
}

function metaRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 28, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: ": " + value })] })],
      }),
    ],
  });
}

function paragraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text })],
  });
}

export async function buildRppDocxBuffer(data: RppViewData): Promise<Buffer> {
  const meta = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      metaRow("Mata Pelajaran", data.mapelNama),
      metaRow("Kelas / Semester", `${data.kelasNama}${data.semester ? " / " + data.semester : ""}`),
      metaRow("Materi", data.materi),
      metaRow("Alokasi Waktu", data.alokasiWaktu),
      ...(data.tahunAjaran ? [metaRow("Tahun Ajaran", data.tahunAjaran)] : []),
    ],
  });

  const pertemuanParas: Paragraph[] = [];
  data.pertemuan.forEach((p, i) => {
    pertemuanParas.push(new Paragraph({
      spacing: { before: 80, after: 20 },
      children: [new TextRun({ text: `Pertemuan ${i + 1}`, bold: true })],
    }));
    p.isiKegiatan.split("\n").forEach((line) => {
      pertemuanParas.push(new Paragraph({ children: [new TextRun({ text: line })], indent: { left: 360 } }));
    });
  });

  const penilaianParas: Paragraph[] = [];
  if (data.penilaian) {
    for (const [lbl, val] of [
      ["Pengetahuan", data.penilaian.pengetahuan],
      ["Keterampilan", data.penilaian.keterampilan],
      ["Sikap", data.penilaian.sikap],
    ] as [string, string][]) {
      penilaianParas.push(new Paragraph({
        spacing: { before: 60, after: 20 },
        children: [new TextRun({ text: lbl, bold: true })],
      }));
      penilaianParas.push(new Paragraph({ children: [new TextRun({ text: val })], indent: { left: 360 } }));
    }
  }

  const pengesahan = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [
            new Paragraph({ children: [new TextRun({ text: "Mengetahui,", italics: true })] }),
            new Paragraph({ children: [new TextRun({ text: "Kepala Sekolah", italics: true })] }),
            new Paragraph({ text: "" }), new Paragraph({ text: "" }), new Paragraph({ text: "" }),
            new Paragraph({ children: [new TextRun({ text: data.namaKepalaSekolah ?? ".................", bold: true, underline: {} })] }),
          ]}),
          new TableCell({ children: [
            new Paragraph({ children: [new TextRun({ text: "Tempat & Tanggal", italics: true })] }),
            new Paragraph({ text: "" }), new Paragraph({ text: "" }), new Paragraph({ text: "" }),
            new Paragraph({ children: [new TextRun({ text: `${data.tempat ?? "Purbalingga"}, ${fmtTanggal(data.tanggalPengesahan)}`, bold: true })] }),
          ]}),
          new TableCell({ children: [
            new Paragraph({ children: [new TextRun({ text: "Guru Pengampu", italics: true })] }),
            new Paragraph({ text: "" }), new Paragraph({ text: "" }), new Paragraph({ text: "" }),
            new Paragraph({ children: [new TextRun({ text: data.namaUstadz, bold: true, underline: {} })] }),
          ]}),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "RENCANA PELAKSANAAN PEMBELAJARAN", bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Griya Qur\'an "Tunas Ilmu" — Purbalingga', italics: true })],
            spacing: { after: 120 },
          }),
          meta,
          heading("Tujuan Pembelajaran"),
          ...data.tujuanPembelajaran.split("\n").map((line) => paragraph(line)),
          heading("Kegiatan Pembelajaran"),
          ...pertemuanParas,
          heading("Penilaian"),
          ...penilaianParas,
          heading("Pengesahan"),
          pengesahan,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}