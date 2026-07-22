// Halaman buat RPP dibantu AI: upload foto materi → generate → review → simpan.
import { getRppFormProps } from "../../_load";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AiRppForm from "./AiRppForm";

export const metadata = { title: "Buat RPP dengan AI — Guru" };

export default async function NewRppAiPage() {
  const props = await getRppFormProps();
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
      <Link
        href="/guru/rpp/baru"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Pilih cara lain
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Buat RPP dengan AI</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Foto materi pembelajaran, AI akan membaca &amp; mengisi kolom RPP otomatis. Anda tetap memeriksa &amp; menyimpan.
      </p>
      <AiRppForm
        mapelOptions={props.mapelOptions}
        kelasByMapel={props.kelasByMapel}
        namaKepalaSekolah={props.namaKepalaSekolah}
        namaUstadz={props.namaUstadz}
      />
    </div>
  );
}