// Halaman upload RPP PDF yang sudah dibuat guru sebelumnya.
import { getRppFormProps } from "../../_load";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import UploadRppForm from "./UploadRppForm";

export const metadata = { title: "Upload RPP PDF — Guru" };

export default async function NewRppUploadPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmed?: string }>;
}) {
  const { confirmed } = await searchParams;
  if (confirmed !== "1") redirect("/guru/rpp/baru");

  const props = await getRppFormProps();
  if (!props) {
    return <Card className="p-8 text-center text-muted-foreground">Profil Guru tidak ditemukan. Hubungi Admin.</Card>;
  }
  if (!props.canCreate) {
    return (
      <Card className="p-8 text-center">
        <p className="text-foreground font-medium">Anda belum memiliki penugasan.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Admin/PJ Kurikulum perlu menugaskan Anda ke minimal satu Mapel &amp; Kelas sebelum Anda bisa mengunggah RPP.
        </p>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link
        href="/guru/rpp/baru"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Pilih cara lain
      </Link>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">Upload RPP PDF</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Upload PDF RPP yang sudah sesuai format. File maksimal 10 MB.
      </p>
      <UploadRppForm
        mapelOptions={props.mapelOptions}
        kelasByMapel={props.kelasByMapel}
      />
    </div>
  );
}
