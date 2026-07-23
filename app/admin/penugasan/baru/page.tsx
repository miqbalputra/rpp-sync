// Tambah Penugasan.
import { prisma } from "@/lib/db";
import { createPenugasan } from "../actions";
import { ErrorBanner } from "@/components/admin/ui";
import PenugasanForm from "./PenugasanForm";

export const metadata = { title: "Tambah Penugasan — Admin" };

export default async function NewPenugasanPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [guruList, mapelList, kelasList, existingRows] = await Promise.all([
    prisma.guru.findMany({
      where: { deletedAt: null },
      orderBy: { namaTampil: "asc" },
      include: { user: { select: { nama: true, gender: true } } },
    }),
    prisma.mapel.findMany({ where: { deletedAt: null }, orderBy: { namaMapel: "asc" } }),
    prisma.kelas.findMany({ where: { deletedAt: null }, orderBy: { namaKelas: "asc" } }),
    // existingRows TIDAK difilter deletedAt: duplikat vs baris di Sampah tetap
    // dicegah (constraint unik DB) — admin diminta memulihkan dari Sampah instead.
    prisma.penugasan.findMany({ select: { guruId: true, mapelId: true, kelasId: true } }),
  ]);

  const canCreate = guruList.length > 0 && mapelList.length > 0 && kelasList.length > 0;

  const guruOpts = guruList.map((g) => ({
    id: g.id,
    nama: g.namaTampil,
    gender: g.user.gender,
  }));
  const mapelOpts = mapelList.map((m) => ({ id: m.id, nama: m.namaMapel }));
  const kelasOpts = kelasList.map((k) => ({
    id: k.id,
    nama: k.namaKelas,
    gender: k.gender,
    tahunAjaran: k.tahunAjaran,
  }));
  const existing = existingRows.map((r) => `${r.guruId}|${r.mapelId}|${r.kelasId}`);

  return (
    <>
      <ErrorBanner message={error ? decodeURIComponent(error) : null} />
      {canCreate ? (
        <PenugasanForm
          guruList={guruOpts}
          mapelList={mapelOpts}
          kelasList={kelasOpts}
          existing={existing}
          action={createPenugasan}
        />
      ) : (
        <div className="max-w-2xl">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            Butuh minimal 1 Guru, 1 Mapel, dan 1 Kelas sebelum membuat penugasan.
          </div>
        </div>
      )}
    </>
  );
}