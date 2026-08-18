import { notFound } from "next/navigation";
import { requireAdminOrPj } from "@/lib/auth-guard";
import { getPromesFormOptions } from "@/lib/promes/queries";
import { prisma } from "@/lib/db";
import { updatePromes } from "../../actions";
import PromesForm from "../../PromesForm";

export const metadata = { title: "Edit Promes — Sinkronisasi RPP" };

export default async function EditPromesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdminOrPj();
  const { id } = await params;
  const [{ mapel, kelas }, promes, query] = await Promise.all([
    getPromesFormOptions(),
    prisma.promes.findUnique({ where: { id }, include: { mapel: true, kelas: true } }),
    searchParams,
  ]);
  if (!promes) notFound();

  return (
    <PromesForm
      mapel={mapel}
      kelas={kelas}
      action={updatePromes.bind(null, id)}
      error={query.error ? decodeURIComponent(query.error) : undefined}
      initial={{ mapelId: promes.mapelId, kelasId: promes.kelasId, url: promes.url }}
      title="Edit Promes"
    />
  );
}
