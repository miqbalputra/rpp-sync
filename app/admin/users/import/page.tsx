// Halaman Import Guru via Excel (Admin only).
import { requireAdmin } from "@/lib/auth-guard";
import { PageHeader, Card, PrimaryLink } from "@/components/admin/ui";
import { Download, FileSpreadsheet } from "lucide-react";
import GuruImportForm from "./GuruImportForm";

export const metadata = { title: "Import Guru — Admin" };

export default async function ImportGuruPage() {
  await requireAdmin();

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Import Guru"
        subtitle="Buat banyak akun guru sekaligus dari file .xlsx"
        action={
          <div className="flex items-center gap-2">
            <a
              href="/admin/users/template-guru"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <Download className="h-4 w-4" /> Template
            </a>
            <a
              href="/admin/users/export-guru"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <FileSpreadsheet className="h-4 w-4" /> Export
            </a>
          </div>
        }
      />

      <Card className="p-5 space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Format file</p>
          <p>
            Pakai tombol <span className="font-medium text-foreground">Template</span> untuk mengunduh format
            <span className="font-mono"> .xlsx</span> sudah jadi (ada sheet <span className="font-mono">Guru</span> + <span className="font-mono">Petunjuk</span>).
          </p>
          <p className="mt-2">
            Kolom: <span className="font-mono">Nama*, Username*, Email*, Password*, Gender, Aktif</span>. Baris dengan
            email/username sudah ada akan <span className="font-medium">dilewati</span>; baris tidak valid dicatat sebagai
            error tanpa membatalkan import lain. Maks. 500 baris / 2 MB.
          </p>
        </div>

        <GuruImportForm />
      </Card>

      <div className="mt-4">
        <PrimaryLink href="/admin/users">Kembali ke Daftar User</PrimaryLink>
      </div>
    </div>
  );
}