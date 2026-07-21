"use client";
// Form Penugasan ber-cascade: Guru → Mapel → Kelas.
// Memilih guru menyaring pilihan kelas sesuai gender guru (PRD §5.4), dengan opsi
// pengecualian lintas gender. Kombinasi (guru+mapel+kelas) yang sudah ada diblok.
import { useMemo, useState } from "react";
import {
  PageHeader, Card, FieldLabel, inputClass, Button, CancelLink,
} from "@/components/admin/ui";

type GuruOpt = { id: string; nama: string; gender: string | null };
type MapelOpt = { id: string; nama: string };
type KelasOpt = { id: string; nama: string; gender: string; tahunAjaran: string };

export default function PenugasanForm({
  guruList,
  mapelList,
  kelasList,
  existing,
  action,
}: {
  guruList: GuruOpt[];
  mapelList: MapelOpt[];
  kelasList: KelasOpt[];
  // Set "guruId|mapelId|kelasId" yang sudah ada — untuk deteksi duplikat.
  existing: string[];
  action: (formData: FormData) => void;
}) {
  const [guruId, setGuruId] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [kelasId, setKelasId] = useState("");
  const [lintasGender, setLintasGender] = useState(false);

  const guru = guruList.find((g) => g.id === guruId) ?? null;

  // Kelas tersaring: default ikuti gender guru; bila lintasGender diaktifkan, tampilkan semua.
  const kelasFiltered = useMemo(() => {
    if (!guru || !guru.gender || lintasGender) return kelasList;
    return kelasList.filter((k) => k.gender === guru.gender);
  }, [kelasList, guru, lintasGender]);

  const isDuplicate = useMemo(() => {
    if (!guruId || !mapelId || !kelasId) return false;
    return existing.includes(`${guruId}|${mapelId}|${kelasId}`);
  }, [existing, guruId, mapelId, kelasId]);

  const kelasMismatch = !!guru?.gender && !!kelasId && (() => {
    const k = kelasList.find((x) => x.id === kelasId);
    return k && k.gender !== guru.gender;
  })();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Tambah Penugasan" subtitle="Hubungkan Guru → Mapel → Kelas (bertingkat)" />
      <Card className="p-5">
        <form action={action} className="space-y-4">
          <div>
            <FieldLabel htmlFor="guruId">Guru</FieldLabel>
            <select
              id="guruId"
              name="guruId"
              required
              value={guruId}
              onChange={(e) => {
                setGuruId(e.target.value);
                setKelasId("");
                setLintasGender(false);
              }}
              className={inputClass}
            >
              <option value="" disabled>— pilih guru —</option>
              {guruList.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama}
                  {g.gender ? ` (${g.gender === "IKHWAN" ? "Ikhwan" : "Akhwat"})` : "—"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel htmlFor="mapelId">Mata Pelajaran</FieldLabel>
            <select
              id="mapelId"
              name="mapelId"
              required
              value={mapelId}
              onChange={(e) => setMapelId(e.target.value)}
              disabled={!guruId}
              className={inputClass}
            >
              <option value="" disabled>
                {guruId ? "— pilih mapel —" : "— pilih guru dulu —"}
              </option>
              {mapelList.map((m) => (
                <option key={m.id} value={m.id}>{m.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <FieldLabel htmlFor="kelasId">Kelas</FieldLabel>
              {guru?.gender && (
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={lintasGender}
                    onChange={(e) => {
                      setLintasGender(e.target.checked);
                      setKelasId("");
                    }}
                    className="h-3.5 w-3.5 rounded border-gray-300"
                  />
                  Tampilkan kelas lintas gender
                </label>
              )}
            </div>
            <select
              id="kelasId"
              name="kelasId"
              required
              value={kelasId}
              onChange={(e) => setKelasId(e.target.value)}
              disabled={!mapelId}
              className={inputClass}
            >
              <option value="" disabled>
                {mapelId ? "— pilih kelas —" : "— pilih mapel dulu —"}
              </option>
              {kelasFiltered.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama} ({k.gender === "IKHWAN" ? "Ikhwan" : "Akhwat"}) — {k.tahunAjaran}
                </option>
              ))}
            </select>
            {kelasMismatch && (
              <p className="text-xs text-warning-700 dark:text-warning-400 mt-1.5">
                Lintas gender — pengecualian, perlu konfirmasi Admin/PJ.
              </p>
            )}
            {isDuplicate && (
              <p className="text-xs text-error-600 dark:text-error-400 mt-1.5">
                Penugasan ini sudah ada (guru + mapel + kelas yang sama).
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" className={isDuplicate ? "opacity-50 pointer-events-none" : ""}>Simpan</Button>
            <CancelLink href="/admin/penugasan" />
          </div>
        </form>
      </Card>
    </div>
  );
}