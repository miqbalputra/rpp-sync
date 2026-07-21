// Tampilan RPP (read-only) — layout tabel berborder meniru format rpp.pdf.
// Body di-generate dari sumber tunggal lib/rpp/view-html.ts agar SAMA PERSIS
// dengan export gambar/PDF. Dipakai di halaman detail, referensi, & export.
import { rppBodyHtml } from "@/lib/rpp/view-html";

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

export function RppView({ data }: { data: RppViewData }) {
  return <article dangerouslySetInnerHTML={{ __html: rppBodyHtml(data) }} />;
}