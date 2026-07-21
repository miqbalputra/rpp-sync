// Form tambah Mapel.
import { createMapel } from "../actions";
import { PageHeader, Card, FieldLabel, inputClass, Button, ErrorBanner, CancelLink } from "@/components/admin/ui";

export const metadata = { title: "Tambah Mapel — Admin" };

export default async function NewMapelPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="max-w-lg">
      <PageHeader title="Tambah Mata Pelajaran" />
      <ErrorBanner message={error ? decodeURIComponent(error) : null} />
      <Card className="p-5">
        <form action={createMapel} className="space-y-4">
          <div>
            <FieldLabel htmlFor="namaMapel">Nama Mapel</FieldLabel>
            <input
              id="namaMapel"
              name="namaMapel"
              required
              autoFocus
              className={inputClass}
              placeholder="cth: Al-Qur'an, Hadits, Fiqih..."
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