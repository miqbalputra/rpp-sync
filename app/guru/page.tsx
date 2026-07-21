// Dashboard Guru (PRD Tahap 10) — daftar RPP + shortcut buat.
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGuruIdFromSession } from "@/lib/rpp/queries";
import Link from "next/link";
import { Plus, ArrowRight, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard Guru — Sinkronisasi RPP" };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft", DIAJUKAN: "Diajukan", DIREVIEW_PJ: "Direview PJ", DISETUJUI_KEPALA: "Disetujui",
};
const STATUS_VARIANT: Record<string, "secondary" | "warning" | "info" | "success"> = {
  DRAFT: "secondary", DIAJUKAN: "warning", DIREVIEW_PJ: "info", DISETUJUI_KEPALA: "success",
};

export default async function GuruHomePage() {
  const session = await auth();
  const guruId = await getGuruIdFromSession(session);
  const rppList = guruId
    ? await prisma.rpp.findMany({
        where: { guruId, deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { mapel: true, kelas: true },
      })
    : [];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Guru</h1>
          <p className="text-sm text-muted-foreground">Halo, {session?.user?.name ?? "Guru"}</p>
        </div>
        <Link href="/guru/rpp/baru" className={cn(buttonVariants({ variant: "default" }))}>
          <Plus className="h-4 w-4" /> Buat RPP Baru
        </Link>
      </div>

      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">RPP Terbaru</h2>
          <Link href="/guru/rpp" className="text-sm font-medium text-primary inline-flex items-center gap-1 hover:underline">
            Lihat semua <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {!guruId ? (
          <div className="p-8 text-center text-sm text-error-600 dark:text-error-400">Profil Guru belum lengkap. Hubungi Admin.</div>
        ) : rppList.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-sm text-muted-foreground">Belum ada RPP. Mulai buat RPP pertama Anda.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rppList.map((r) => (
              <li key={r.id}>
                <Link href={`/guru/rpp/${r.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors">
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">{r.materi}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{r.mapel.namaMapel} · {r.kelas.namaKelas}</div>
                  </div>
                  <Badge variant={STATUS_VARIANT[r.status] ?? "secondary"} className="ml-3 shrink-0">
                    {STATUS_LABEL[r.status] ?? r.status}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}