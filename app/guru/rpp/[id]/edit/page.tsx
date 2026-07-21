// Halaman edit RPP.
import { getRppFormProps } from "../../_load";
import { loadRppForEdit } from "@/lib/rpp/queries";
import RppForm from "../../RppForm";
import { updateRpp } from "../../actions";
import { notFound } from "next/navigation";

export const metadata = { title: "Edit RPP — Guru" };

export default async function EditRppPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const props = await getRppFormProps();
  if (!props) notFound();

  let rpp;
  try {
    rpp = await loadRppForEdit(id, props.guruId);
  } catch {
    notFound();
  }

  const defaultValues = {
    mapelId: rpp.mapelId,
    kelasId: rpp.kelasId,
    noRpp: rpp.noRpp ?? "",
    materi: rpp.materi,
    alokasiWaktu: rpp.alokasiWaktu,
    tujuanPembelajaran: rpp.tujuanPembelajaran,
    tanggalPengesahan: rpp.tanggalPengesahan.toISOString().slice(0, 10),
    pertemuan: rpp.pertemuan.map((p) => ({ id: p.id, isiKegiatan: p.isiKegiatan })),
    penilaian: {
      pengetahuan: rpp.penilaian?.pengetahuan ?? "",
      keterampilan: rpp.penilaian?.keterampilan ?? "",
      sikap: rpp.penilaian?.sikap ?? "",
    },
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-4">Edit RPP</h1>
      <RppForm
        action={updateRpp.bind(null, id)}
        mapelOptions={props.mapelOptions}
        kelasByMapel={props.kelasByMapel}
        namaKepalaSekolah={props.namaKepalaSekolah}
        namaUstadz={props.namaUstadz}
        defaultValues={defaultValues}
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}