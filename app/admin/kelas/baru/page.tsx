// Tambah Kelas.
import { createKelas } from "../actions";
import KelasForm from "../_KelasForm";
import { PageHeader, Card, ErrorBanner } from "@/components/admin/ui";

export const metadata = { title: "Tambah Kelas — Admin" };

export default async function NewKelasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="max-w-2xl">
      <PageHeader title="Tambah Kelas" />
      <ErrorBanner message={error ? decodeURIComponent(error) : null} />
      <Card className="p-5">
        <KelasForm action={createKelas} />
      </Card>
    </div>
  );
}