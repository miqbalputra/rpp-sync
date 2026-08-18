import { Card } from "@/components/ui/card";
import { Button, CancelLink, ErrorBanner, FieldLabel, inputClass, PageHeader } from "@/components/admin/ui";

type Option = { id: string; namaMapel?: string; namaKelas?: string; gender?: "IKHWAN" | "AKHWAT" };

export default function PromesForm({
  mapel,
  kelas,
  action,
  error,
  initial,
  title,
}: {
  mapel: Option[];
  kelas: Option[];
  action: (formData: FormData) => Promise<void>;
  error?: string;
  initial?: { mapelId: string; kelasId: string; url: string };
  title: string;
}) {
  return (
    <div className="max-w-2xl">
      <PageHeader title={title} subtitle="Hubungkan satu link spreadsheet Promes dengan Mapel dan Kelas." />
      <ErrorBanner message={error} />
      <Card className="p-5">
        <form action={action} className="space-y-4">
          <div>
            <FieldLabel htmlFor="mapelId">Mata Pelajaran</FieldLabel>
            <select id="mapelId" name="mapelId" required defaultValue={initial?.mapelId ?? ""} className={inputClass}>
              <option value="" disabled>— pilih mapel —</option>
              {mapel.map((item) => <option key={item.id} value={item.id}>{item.namaMapel}</option>)}
            </select>
          </div>

          <div>
            <FieldLabel htmlFor="kelasId">Kelas</FieldLabel>
            <select id="kelasId" name="kelasId" required defaultValue={initial?.kelasId ?? ""} className={inputClass}>
              <option value="" disabled>— pilih kelas —</option>
              {kelas.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.namaKelas} ({item.gender === "IKHWAN" ? "Ikhwan" : "Akhwat"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel htmlFor="url">Link Spreadsheet Promes</FieldLabel>
            <input
              id="url"
              name="url"
              type="url"
              required
              inputMode="url"
              placeholder="https://docs.google.com/spreadsheets/..."
              defaultValue={initial?.url ?? ""}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-muted-foreground">Gunakan link HTTPS yang dapat dibuka oleh Guru terkait.</p>
          </div>

          <div className="flex gap-2">
            <Button type="submit">Simpan</Button>
            <CancelLink href="/promes" />
          </div>
        </form>
      </Card>
    </div>
  );
}
