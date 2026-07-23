// Edit Kelas.
import { prisma } from "@/lib/db";
import { updateKelas } from "../../actions";
import KelasForm from "../../_KelasForm";
import { PageHeader, Card, ErrorBanner } from "@/components/admin/ui";
import { notFound } from "next/navigation";

export const metadata = { title: "Edit Kelas — Admin" };

export default async function EditKelasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const kelas = await prisma.kelas.findFirst({ where: { id, deletedAt: null } });
  if (!kelas) notFound();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Edit Kelas" />
      <ErrorBanner message={error ? decodeURIComponent(error) : null} />
      <Card className="p-5">
        <KelasForm
          action={updateKelas.bind(null, id)}
          defaultValues={{
            namaKelas: kelas.namaKelas,
            semester: kelas.semester,
            gender: kelas.gender,
            tahunAjaran: kelas.tahunAjaran,
          }}
        />
      </Card>
    </div>
  );
}