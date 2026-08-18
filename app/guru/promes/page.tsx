// Daftar Promes berdasarkan penugasan Guru yang aktif.
import { ExternalLink, Link2 } from "lucide-react";
import { requireGuru } from "@/lib/auth-guard";
import { getGuruIdFromSession } from "@/lib/rpp/queries";
import { getPromesForGuru } from "@/lib/promes/queries";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Promes Saya — Guru" };

export default async function GuruPromesPage() {
  const session = await requireGuru();
  const guruId = await getGuruIdFromSession(session);

  if (!guruId) {
    return <Card className="p-8 text-center text-muted-foreground">Profil Guru tidak ditemukan. Hubungi Admin.</Card>;
  }

  const rows = await getPromesForGuru(guruId);

  return (
    <div>
      <PageHeader
        title="Promes Saya"
        subtitle="Program Semester sesuai penugasan Mapel dan Kelas Anda"
      />

      {rows.length === 0 ? (
        <Card className="p-10 text-center">
          <Link2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Belum ada penugasan Mapel dan Kelas.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <Card key={`${row.mapelId}:${row.kelasId}`} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-foreground">{row.mapelNama}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.kelasNama} ({row.kelasGender === "IKHWAN" ? "Ikhwan" : "Akhwat"})
                    {row.semester ? ` · ${row.semester}` : ""}
                  </p>
                </div>
                <Link2 className="h-5 w-5 shrink-0 text-primary" />
              </div>

              {row.promes ? (
                <a
                  href={row.promes.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" /> Lihat Promes
                </a>
              ) : (
                <p className="mt-5 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400">
                  Promes belum tersedia
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
