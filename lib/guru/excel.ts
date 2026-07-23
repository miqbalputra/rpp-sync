// Helper Excel untuk import/export data Guru (User role=GURU + profil Guru).
// Library: exceljs (server-side). Dipakai route export/template + server action import.
import ExcelJS from "exceljs";
import { z } from "zod";

// ----- Header -----
export const IMPORT_HEADERS = ["Nama", "Username", "Email", "Password", "Gender", "Aktif"] as const;
export const EXPORT_HEADERS = ["Nama", "Username", "Email", "Gender", "Status"] as const;

const GENDERS = ["IKHWAN", "AKHWAT"] as const;

// ----- Tipe publik -----
export type GuruExportRow = {
  nama: string;
  username: string;
  email: string | null;
  gender: string | null;
  aktif: boolean;
};

export type GuruImportRow = {
  rowNumber: number; // baris di file Excel (mulai 2; 1 = header)
  nama: string;
  username: string;
  email: string | null; // lowercased; null = belum punya email (diisi guru via Akun)
  password: string;
  gender: "IKHWAN" | "AKHWAT" | null;
  aktif: boolean;
};

export type ImportError = { row: number; message: string };
export type ImportParseResult = { rows: GuruImportRow[]; errors: ImportError[] };

// ----- Skema validasi per baris (setelah normalisasi) -----
const GuruRowSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(100),
  username: z.string().min(3, "Username minimal 3 karakter").max(50),
  email: z.string().email("Email tidak valid").nullable(), // null = opsional, diisi guru nanti
  password: z.string().min(6, "Password minimal 6 karakter"),
  gender: z.enum(GENDERS, { message: "Gender harus IKHWAN atau AKHWAT" }).nullable(),
  aktif: z.boolean(),
});

// ----- Normalisasi nilai cell -----
function normText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  // exceljs rich text / formula result
  if (typeof v === "object" && "richText" in (v as any)) {
    return ((v as any).richText as { text: string }[]).map((r) => r.text).join("").trim();
  }
  if (typeof v === "object" && "result" in (v as any)) return String((v as any).result ?? "").trim();
  return String(v).trim();
}

function parseGender(v: unknown): "IKHWAN" | "AKHWAT" | null {
  const s = normText(v).toUpperCase();
  if (s === "") return null;
  if (s === "IKHWAN" || s === "I") return "IKHWAN";
  if (s === "AKHWAT" || s === "A") return "AKHWAT";
  return s as "IKHWAN" | "AKHWAT"; // akan divalidasi zod (tolak jika tidak tepat)
}

function parseAktif(v: unknown): boolean {
  const s = normText(v).toLowerCase();
  if (s === "") return true; // default aktif
  if (["true", "1", "ya", "aktif", "y"].includes(s)) return true;
  if (["false", "0", "tidak", "nonaktif", "n"].includes(s)) return false;
  return true;
}

function isEmptyRow(cells: unknown[]): boolean {
  return cells.every((c) => normText(c) === "");
}

// ----- Build workbook -----

/** Workbook template untuk import: sheet "Guru" (header + 1 contoh) + sheet "Petunjuk". */
export async function buildGuruTemplateWorkbook(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sinkronisasi RPP";
  wb.created = new Date();

  const ws = wb.addWorksheet("Guru");
  ws.columns = [
    { header: IMPORT_HEADERS[0], width: 28 },
    { header: IMPORT_HEADERS[1], width: 18 },
    { header: IMPORT_HEADERS[2], width: 32 },
    { header: IMPORT_HEADERS[3], width: 18 },
    { header: IMPORT_HEADERS[4], width: 12 },
    { header: IMPORT_HEADERS[5], width: 10 },
  ];
  // Header tebal
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).alignment = { horizontal: "center" };

  // Baris contoh (baris 2) — boleh dihapus sebelum import. Email sengaja dikosongkan
  // untuk menunjukkan bahwa email opsional (diisi guru sendiri via menu Akun nanti).
  ws.addRow(["Ustadz Contoh", "ustadzcontoh", "", "rahasia123", "IKHWAN", "TRUE"]);

  // Sheet petunjuk
  const help = wb.addWorksheet("Petunjuk");
  help.getColumn(1).width = 90;
  help.addRow(["PETUNJUK IMPORT GURU"]);
  help.getCell("A1").font = { bold: true, size: 14 };
  const lines = [
    "",
    "Isi sheet 'Guru' mulai baris 2. Baris 1 = header (jangan diubah).",
    "Kolom wajib: Nama, Username, Password. Email OPSIONAL (boleh kosong).",
    "Username minimal 3 karakter & unik. Email (jika diisi) valid & unik, lowercase otomatis.",
    "Email kosong = guru login pakai username+password dulu; email bisa diisi sendiri lewat menu Akun.",
    "Password minimal 6 karakter. Password disimpan ter-hash; sarankan ganti via menu Akun setelah login.",
    "Gender: IKHWAN atau AKHWAT (kosong = tidak diset).",
    "Aktif: TRUE/FALSE (kosong = TRUE).",
    "Baris yang sudah ada username (atau email bila diisi) di database akan dilewati (skipped), bukan error.",
    "Baris dengan data tidak valid dicatat sebagai error (baris + alasan) tanpa membatalkan import lain.",
    "Maksimum 500 baris per file. Format file: .xlsx.",
    "",
    "Contoh (Email dikosongkan):",
    "Ustadz Contoh | ustadzcontoh |  | rahasia123 | IKHWAN | TRUE",
  ];
  lines.forEach((l) => help.addRow([l]));

  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** Workbook export daftar guru (tanpa kolom Password). */
export async function buildGuruExportWorkbook(rows: GuruExportRow[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sinkronisasi RPP";
  wb.created = new Date();

  const ws = wb.addWorksheet("Guru");
  ws.columns = [
    { header: EXPORT_HEADERS[0], width: 28 },
    { header: EXPORT_HEADERS[1], width: 18 },
    { header: EXPORT_HEADERS[2], width: 32 },
    { header: EXPORT_HEADERS[3], width: 12 },
    { header: EXPORT_HEADERS[4], width: 10 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).alignment = { horizontal: "center" };

  rows.forEach((r) => {
    ws.addRow([
      r.nama,
      r.username,
      r.email ?? "",
      r.gender ?? "",
      r.aktif ? "Aktif" : "Nonaktif",
    ]);
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ----- Parse workbook import -----
/**
 * Baca buffer .xlsx, kembalikan baris yang lolos validasi + daftar error per baris.
 * Baris kosong dilewati. Header (baris 1) diabaikan.
 */
export async function parseGuruImportWorkbook(buffer: Buffer): Promise<ImportParseResult> {
  const wb = new ExcelJS.Workbook();
  // Cast: tipe Buffer exceljs (interface lama) tidak sama persis dengan Node Buffer
  // modern, padahal runtime menerima keduanya.
  await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const ws = wb.getWorksheet("Guru") ?? wb.worksheets[0];
  if (!ws) {
    return { rows: [], errors: [{ row: 0, message: "Sheet 'Guru' tidak ditemukan dalam file" }] };
  }

  const rows: GuruImportRow[] = [];
  const errors: ImportError[] = [];

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // header
    // Ambil 6 cell pertama (Nama, Username, Email, Password, Gender, Aktif)
    const cells = [1, 2, 3, 4, 5, 6].map((n) => {
      const c = row.getCell(n);
      return c.value;
    });

    if (isEmptyRow(cells)) return; // skip baris kosong

    const nama = normText(cells[0]);
    const username = normText(cells[1]);
    // Email opsional: cell kosong → null (diisi guru sendiri via Akun nanti).
    const emailRaw = normText(cells[2]).toLowerCase();
    const email = emailRaw === "" ? null : emailRaw;
    const password = normText(cells[3]);
    const gender = parseGender(cells[4]);
    const aktif = parseAktif(cells[5]);

    const parsed = GuruRowSchema.safeParse({ nama, username, email, password, gender, aktif });
    if (!parsed.success) {
      errors.push({ row: rowNumber, message: parsed.error.issues[0].message });
      return;
    }
    rows.push({
      rowNumber,
      nama: parsed.data.nama.trim(),
      username: parsed.data.username.trim(),
      email: parsed.data.email,
      password: parsed.data.password,
      gender: parsed.data.gender,
      aktif: parsed.data.aktif,
    });
  });

  return { rows, errors };
}