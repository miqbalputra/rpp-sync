// Tambah Jadwal Mengajar.
import { getPenugasanTreeForJadwal } from "@/lib/jadwal/queries";
import { requireAdminOrPj } from "@/lib/auth-guard";
import { createJadwal } from "../actions";
import { ErrorBanner } from "@/components/admin/ui";
import JadwalForm from "./JadwalForm";

export const metadata = { title: "Tambah Jadwal — Sinkronisasi RPP" };

export default async function NewJadwalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdminOrPj();
  const { error } = await searchParams;
  const tree = await getPenugasanTreeForJadwal();

  return (
    <>
      <ErrorBanner message={error ? decodeURIComponent(error) : null} />
      {tree.length === 0 ? (
        <div className="max-w-2xl">
          <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/15 dark:text-warning-400">
            Belum ada penugasan. Buat penugasan (guru → mapel → kelas) dulu sebelum menjadwalkan.
          </div>
        </div>
      ) : (
        <JadwalForm tree={tree} action={createJadwal} />
      )}
    </>
  );
}