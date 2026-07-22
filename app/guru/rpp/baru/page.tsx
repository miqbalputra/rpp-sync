// Halaman pilihan cara buat RPP: Manual atau Dibantu AI.
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PenLine, Sparkles, ArrowRight } from "lucide-react";
import { getRppFormProps } from "../_load";
import { getAiConfig } from "@/lib/ai/client";

export const metadata = { title: "Buat RPP — Guru" };

export default async function NewRppChooserPage() {
  const props = await getRppFormProps();
  const aiReady = !!(await getAiConfig());

  if (!props) {
    return <Card className="p-8 text-center text-muted-foreground">Profil Guru tidak ditemukan. Hubungi Admin.</Card>;
  }
  if (!props.canCreate) {
    return (
      <Card className="p-8 text-center">
        <p className="text-foreground font-medium">Anda belum memiliki penugasan.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Admin/PJ Kurikulum perlu menugaskan Anda ke minimal satu Mapel &amp; Kelas sebelum Anda bisa membuat RPP.
        </p>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Buat RPP Baru</h1>
      <p className="text-sm text-muted-foreground mb-6">Pilih cara membuat RPP.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Manual */}
        <Link href="/guru/rpp/baru/manual" className="group block">
          <Card className="h-full p-6 transition hover:border-brand-300 hover:shadow-theme-md dark:hover:border-brand-800">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
              <PenLine className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-foreground">Manual</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Isi semua kolom RPP sendiri secara manual.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400">
              Buat manual <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Card>
        </Link>

        {/* Dibantu AI */}
        {aiReady ? (
          <Link href="/guru/rpp/baru/ai" className="group block">
            <Card className="h-full p-6 transition hover:border-brand-300 hover:shadow-theme-md dark:hover:border-brand-800">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                <Sparkles className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-foreground">Dibantu AI</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Foto materi, AI baca &amp; isi kolom otomatis. Anda tetap periksa &amp; edit sebelum simpan.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400">
                Buat dengan AI <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Card>
          </Link>
        ) : (
          <Card className="h-full p-6 opacity-60">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-gray-800">
              <Sparkles className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-foreground">Dibantu AI</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Admin belum mengaktifkan fitur AI. Minta Admin mengonfigurasi di menu Pengaturan AI.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}