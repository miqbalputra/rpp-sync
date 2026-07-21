"use client";
// Form Jadwal ber-cascade: Guru → Mapel → Kelas (menyimpulkan penugasanId) → Hari & Jam.
// Sumber filter = data Penugasan yang sudah ada, sesuai pola form RPP (mapel→kelas).
import { useMemo, useState } from "react";
import { HARI, HARI_LABEL } from "@/lib/jadwal/schema";
import {
  PageHeader, Card, FieldLabel, inputClass, Button, CancelLink,
} from "@/components/admin/ui";

type TreeNode = {
  id: string;
  guruId: string;
  guruNama: string;
  guruGender: string | null;
  mapelId: string;
  mapelNama: string;
  kelasId: string;
  kelasNama: string;
  kelasGender: string;
};

export default function JadwalForm({
  tree,
  action,
}: {
  tree: TreeNode[];
  // action menerima FormData (form action server). Kita pakai <form action>.
  action: (formData: FormData) => void;
}) {
  const [guruId, setGuruId] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [kelasId, setKelasId] = useState("");

  // Mapel unik untuk guru terpilih.
  const mapelOptions = useMemo(() => {
    const seen = new Map<string, string>();
    tree
      .filter((n) => n.guruId === guruId)
      .forEach((n) => seen.set(n.mapelId, n.mapelNama));
    return Array.from(seen, ([id, nama]) => ({ id, nama }));
  }, [tree, guruId]);

  // Kelas untuk guru+mapel terpilih.
  const kelasOptions = useMemo(() => {
    return tree
      .filter((n) => n.guruId === guruId && n.mapelId === mapelId)
      .map((n) => ({
        id: n.kelasId,
        nama: n.kelasNama,
        gender: n.kelasGender,
      }));
  }, [tree, guruId, mapelId]);

  // penugasanId disimpulkan dari guru+mapel+kelas.
  const penugasanNode = useMemo(() => {
    return tree.find(
      (n) => n.guruId === guruId && n.mapelId === mapelId && n.kelasId === kelasId,
    );
  }, [tree, guruId, mapelId, kelasId]);

  const resetMapel = () => {
    setMapelId("");
    setKelasId("");
  };
  const resetKelas = () => setKelasId("");

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Tambah Jadwal"
        subtitle="Pilih bertingkat: Guru → Mapel → Kelas, lalu atur hari & jam"
      />
      <Card className="p-5">
        <form action={action} className="space-y-4">
          {/* Hidden: penugasanId disimpulkan klien, divalidasi server via Zod */}
          <input type="hidden" name="penugasanId" value={penugasanNode?.id ?? ""} />

          <div>
            <FieldLabel htmlFor="guruId">Guru</FieldLabel>
            <select
              id="guruId"
              name="guruId"
              required
              value={guruId}
              onChange={(e) => {
                setGuruId(e.target.value);
                resetMapel();
              }}
              className={inputClass}
            >
              <option value="" disabled>— pilih guru —</option>
              {uniqGuru(tree).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama}
                  {g.gender ? ` (${g.gender === "IKHWAN" ? "Ikhwan" : "Akhwat"})` : ""}
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
              onChange={(e) => {
                setMapelId(e.target.value);
                resetKelas();
              }}
              disabled={!guruId}
              className={inputClass}
            >
              <option value="" disabled>
                {guruId ? "— pilih mapel —" : "— pilih guru dulu —"}
              </option>
              {mapelOptions.map((m) => (
                <option key={m.id} value={m.id}>{m.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel htmlFor="kelasId">Kelas</FieldLabel>
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
              {kelasOptions.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama} ({k.gender === "IKHWAN" ? "Ikhwan" : "Akhwat"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel htmlFor="hari">Hari</FieldLabel>
            <select id="hari" name="hari" required defaultValue="" className={inputClass}>
              <option value="" disabled>— pilih hari —</option>
              {HARI.map((h) => (
                <option key={h} value={h}>{HARI_LABEL[h]}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="jamMulai">Jam Mulai</FieldLabel>
              <input id="jamMulai" name="jamMulai" type="time" required defaultValue="07:00" className={inputClass} />
            </div>
            <div>
              <FieldLabel htmlFor="jamSelesai">Jam Selesai</FieldLabel>
              <input id="jamSelesai" name="jamSelesai" type="time" required defaultValue="08:00" className={inputClass} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit">Simpan</Button>
            <CancelLink href="/jadwal" />
          </div>
        </form>
      </Card>
    </div>
  );
}

/** Guru unik dari tree (id + nama + gender). */
function uniqGuru(tree: TreeNode[]) {
  const map = new Map<string, { id: string; nama: string; gender: string | null }>();
  tree.forEach((n) => {
    if (!map.has(n.guruId)) {
      map.set(n.guruId, { id: n.guruId, nama: n.guruNama, gender: n.guruGender });
    }
  });
  return Array.from(map.values());
}