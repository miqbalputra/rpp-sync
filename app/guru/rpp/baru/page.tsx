// Halaman buat RPP baru.
import { getRppFormProps } from "../_load";
import RppForm from "../RppForm";
import { createRpp } from "../actions";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Buat RPP — Guru" };

export default async function NewRppPage() {
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
      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-4">Buat RPP Baru</h1>
      <RppForm
        action={createRpp}
        mapelOptions={props.mapelOptions}
        kelasByMapel={props.kelasByMapel}
        namaKepalaSekolah={props.namaKepalaSekolah}
        namaUstadz={props.namaUstadz}
      />
    </div>
  );
}