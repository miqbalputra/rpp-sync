// Form edit Mapel.
import { prisma } from "@/lib/db";
import { updateMapel } from "../../actions";
import { PageHeader, Card, FieldLabel, inputClass, Button, ErrorBanner, CancelLink } from "@/components/admin/ui";
import { notFound } from "next/navigation";

export const metadata = { title: "Edit Mapel — Admin" };

export default async function EditMapelPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const mapel = await prisma.mapel.findFirst({ where: { id, deletedAt: null } });
  if (!mapel) notFound();

  return (
    <div className="max-w-lg">
      <PageHeader title="Edit Mata Pelajaran" />
      <ErrorBanner message={error ? decodeURIComponent(error) : null} />
      <Card className="p-5">
        <form action={updateMapel.bind(null, id)} className="space-y-4">
          <div>
            <FieldLabel htmlFor="namaMapel">Nama Mapel</FieldLabel>
            <input
              id="namaMapel"
              name="namaMapel"
              required
              defaultValue={mapel.namaMapel}
              autoFocus
              className={inputClass}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Simpan</Button>
            <CancelLink href="/admin/mapel" />
          </div>
        </form>
      </Card>
    </div>
  );
}