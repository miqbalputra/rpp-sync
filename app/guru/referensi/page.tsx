// Referensi: pustaka RPP semua guru, dikelompokkan per Kelas → Mapel.
// Tiap RPP ditampilkan sebagai baris collapsible: header identitas guru
// (nama, No. RPP, badge AI, materi) selalu tampil; isi RPP penuh dibuka saat
// di-klik. Tombol Duplikat di luar <details> agar selalu tampak tanpa toggle.
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGuruIdFromSession, getNamaKepalaSekolah } from "@/lib/rpp/queries";
import { duplicateRpp } from "./actions";
import { Card } from "@/components/ui/card";
import { Copy, ChevronRight } from "lucide-react";
import { AiBadge } from "@/components/rpp/AiBadge";
import { RppView, type RppViewData } from "@/components/rpp/RppView";
import { ReferensiFilterClient } from "@/components/guru/ReferensiFilterClient";

export const metadata = { title: "Referensi — Guru" };

type RppRow = {
  id: string;
  guruId: string | null;
  noRpp: string | null;
  dibuatDenganAI: boolean;
  materi: string;
  alokasiWaktu: string;
  tujuanPembelajaran: string;
  tanggalPengesahan: Date;
  mapel: { id: string; namaMapel: string };
  kelas: {
    id: string;
    namaKelas: string;
    semester: string;
    gender: "IKHWAN" | "AKHWAT";
    tahunAjaran: string;
  };
  guru: { namaTampil: string } | null;
  pertemuan: { urutan: number; isiKegiatan: string; tanggal: Date | null }[];
  penilaian: { pengetahuan: string; keterampilan: string; sikap: string } | null;
};

function genderLabel(g: "IKHWAN" | "AKHWAT") {
  return g === "IKHWAN" ? "Ikhwan" : "Akhwat";
}

function toViewData(r: RppRow, namaKepalaSekolah: string | null): RppViewData {
  return {
    noRpp: r.noRpp,
    dibuatDenganAI: r.dibuatDenganAI,
    materi: r.materi,
    alokasiWaktu: r.alokasiWaktu,
    tujuanPembelajaran: r.tujuanPembelajaran,
    tanggalPengesahan: r.tanggalPengesahan,
    mapelNama: r.mapel.namaMapel,
    kelasNama: r.kelas.namaKelas,
    kelasGender: r.kelas.gender,
    semester: r.kelas.semester,
    tahunAjaran: r.kelas.tahunAjaran,
    namaUstadz: r.guru?.namaTampil ?? "",
    namaKepalaSekolah,
    tempat: "Purbalingga",
    pertemuan: r.pertemuan.map((p) => ({ urutan: p.urutan, isiKegiatan: p.isiKegiatan, tanggal: p.tanggal })),
    penilaian: r.penilaian
      ? { pengetahuan: r.penilaian.pengetahuan, keterampilan: r.penilaian.keterampilan, sikap: r.penilaian.sikap }
      : null,
  };
}

export default async function ReferensiPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await auth();
  const guruId = await getGuruIdFromSession(session);
  const namaKepalaSekolah = await getNamaKepalaSekolah();

  // Semua RPP (tidak difilter penugasan), diurutkan Kelas (gender, nama) → Mapel → terbaru.
  // Sembunyikan RPP yang mapel/kelas/guru-nya sudah masuk Sampah.
  const rppList: RppRow[] = guruId
    ? await prisma.rpp.findMany({
        where: {
          deletedAt: null,
          mapel: { deletedAt: null },
          kelas: { deletedAt: null },
          guru: { deletedAt: null },
        },
        orderBy: [
          { kelas: { gender: "asc" } },
          { kelas: { namaKelas: "asc" } },
          { mapel: { namaMapel: "asc" } },
          { updatedAt: "desc" },
        ],
        include: {
          mapel: true,
          kelas: true,
          guru: { select: { namaTampil: true } },
          pertemuan: { orderBy: { urutan: "asc" } },
          penilaian: true,
        },
      })
    : [];

  // Kelompokkan: kelasId → mapelId → daftar RPP.
  const byKelas = new Map<
    string,
    { kelas: RppRow["kelas"]; byMapel: Map<string, { mapel: RppRow["mapel"]; rpps: RppRow[] }> }
  >();
  for (const r of rppList) {
    let k = byKelas.get(r.kelas.id);
    if (!k) {
      k = { kelas: r.kelas, byMapel: new Map() };
      byKelas.set(r.kelas.id, k);
    }
    let m = k.byMapel.get(r.mapel.id);
    if (!m) {
      m = { mapel: r.mapel, rpps: [] };
      k.byMapel.set(r.mapel.id, m);
    }
    m.rpps.push(r);
  }

  return (
    <div>
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Referensi RPP</h1>
        <p className="text-sm text-muted-foreground">
          Pustaka RPP semua guru, dikelompokkan per kelas &amp; mapel (read-only)
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400">
          {decodeURIComponent(error)}
        </div>
      )}

      {!guruId ? (
        <Card className="p-8 text-center text-muted-foreground">Profil Guru tidak ditemukan.</Card>
      ) : rppList.length === 0 ? (
        <Card className="p-12 text-center border-dashed text-muted-foreground">
          Belum ada RPP yang dapat dijadikan referensi.
        </Card>
      ) : (
        <div>
          <ReferensiFilterClient containerId="referensi-list" />
          <div id="referensi-list" className="space-y-6">
            {Array.from(byKelas.values()).map((k) => {
              const kelasTotal = Array.from(k.byMapel.values()).reduce((n, m) => n + m.rpps.length, 0);
              return (
            <section key={k.kelas.id} data-group="kelas" className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Kelas {k.kelas.namaKelas} {genderLabel(k.kelas.gender)}
                </h2>
                {k.kelas.semester && (
                  <span className="text-sm text-muted-foreground">/ {k.kelas.semester}</span>
                )}
                {k.kelas.tahunAjaran && (
                  <span className="text-xs text-muted-foreground">· {k.kelas.tahunAjaran}</span>
                )}
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {kelasTotal} RPP
                </span>
              </div>

              <div className="space-y-4">
                {Array.from(k.byMapel.values()).map((m) => (
                  <div key={m.mapel.id} data-group="mapel" className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {m.mapel.namaMapel}
                      </h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {m.rpps.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {m.rpps.map((r) => {
                        const isOwn = r.guruId === guruId;
                        const haystack = [r.guru?.namaTampil, r.mapel.namaMapel, r.materi, r.noRpp]
                          .filter(Boolean)
                          .join(" ");
                        return (
                          <div
                            key={r.id}
                            data-row
                            data-search={haystack}
                            className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                          >
                            <details className="group flex-1">
                              <summary className="flex cursor-pointer list-none items-center gap-2 p-3">
                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                                <span className="font-medium text-foreground">
                                  {r.guru?.namaTampil ?? "—"}
                                </span>
                                {r.noRpp && (
                                  <span className="text-xs font-mono text-muted-foreground">
                                    No. {r.noRpp}
                                  </span>
                                )}
                                {r.dibuatDenganAI && <AiBadge />}
                                <span className="truncate text-sm text-muted-foreground">
                                  — {r.materi}
                                </span>
                              </summary>
                              <div className="border-t border-gray-200 p-4 dark:border-gray-800">
                                <RppView data={toViewData(r, namaKepalaSekolah)} />
                              </div>
                            </details>

                            {!isOwn && (
                              <form
                                action={duplicateRpp.bind(null, r.id) as unknown as (fd: FormData) => Promise<void>}
                                className="p-3"
                              >
                                <button
                                  type="submit"
                                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                                  title="Duplikat RPP ini sebagai draft Anda"
                                >
                                  <Copy className="h-4 w-4" /> Duplikat
                                </button>
                              </form>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            );
            })}
          </div>
        </div>
      )}
    </div>
  );
}