// Form fields Kelas (dipakai halaman baru & edit).
import { FieldLabel, inputClass, Button, CancelLink } from "@/components/admin/ui";
import { Gender } from "@prisma/client";

export default function KelasForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: {
    namaKelas?: string;
    semester?: string;
    gender?: Gender;
    tahunAjaran?: string;
  };
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="namaKelas">Nama Kelas</FieldLabel>
          <input
            id="namaKelas"
            name="namaKelas"
            required
            autoFocus
            defaultValue={defaultValues?.namaKelas}
            className={inputClass}
            placeholder="cth: 1 Ikhwan"
          />
        </div>
        <div>
          <FieldLabel htmlFor="tahunAjaran">Tahun Ajaran</FieldLabel>
          <input
            id="tahunAjaran"
            name="tahunAjaran"
            required
            defaultValue={defaultValues?.tahunAjaran ?? "2026/2027"}
            className={inputClass}
            placeholder="2026/2027"
          />
        </div>
        <div>
          <FieldLabel htmlFor="semester">Semester</FieldLabel>
          <select
            id="semester"
            name="semester"
            defaultValue={defaultValues?.semester ?? "Ganjil"}
            className={inputClass}
          >
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="gender">Gender</FieldLabel>
          <select
            id="gender"
            name="gender"
            defaultValue={defaultValues?.gender ?? "IKHWAN"}
            className={inputClass}
          >
            <option value="IKHWAN">Ikhwan</option>
            <option value="AKHWAT">Akhwat</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit">Simpan</Button>
        <CancelLink href="/admin/kelas" />
      </div>
    </form>
  );
}