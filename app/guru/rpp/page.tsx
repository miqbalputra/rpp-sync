// Daftar RPP milik guru login.
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGuruIdFromSession } from "@/lib/rpp/queries";
import { softDeleteRpp } from "./actions";
import DeleteButton from "@/components/admin/DeleteButton";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, FileText, Clock, Search } from "lucide-react";

export const metadata = { title: "RPP Saya — Guru" };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft", DIAJUKAN: "Diajukan", DIREVIEW_PJ: "Direview PJ", DISETUJUI_KEPALA: "Disetujui",
};
const STATUS_VARIANT: Record<string, "secondary" | "warning" | "info" | "success"> = {
  DRAFT: "secondary", DIAJUKAN: "warning", DIREVIEW_PJ: "info", DISETUJUI_KEPALA: "success",
};

export default async function MyRppPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const search = q?.trim() ?? "";
  const session = await auth();
  const guruId = await getGuruIdFromSession(session);

  const rppList = guruId
    ? await prisma.rpp.findMany({
        where: {
          guruId,
          deletedAt: null,
          ...(search
            ? { OR: [{ noRpp: { contains: search } }, { materi: { contains: search } }] }
            : {}),
        },
        orderBy: { updatedAt: "desc" },
        include: { mapel: true, kelas: true },
      })
    : [];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">RPP Saya</h1>
          <p className="text-sm text-muted-foreground">{rppList.length} RPP</p>
        </div>
        <Link href="/guru/rpp/baru" className={cn(buttonVariants({ variant: "default" }))}>
          <Plus className="h-4 w-4" /> Buat RPP Baru
        </Link>
      </div>

      {/* Pencarian No. RPP / Materi */}
      <form className="mb-4 flex items-center gap-2" role="search">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Cari No. RPP atau materi…"
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground shadow-theme-xs transition focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden"
          />
        </div>
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Cari
        </button>
        {search && (
          <Link href="/guru/rpp" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Reset
          </Link>
        )}
      </form>

      {rppList.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileText className="h-6 w-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            {search ? `Tidak ada RPP cocok dengan "${search}".` : 'Belum ada RPP. Klik "Buat RPP Baru" untuk memulai.'}
          </p>
          {!guruId && (
            <p className="text-xs text-rose-600 mt-2">Profil Guru Anda belum lengkap. Hubungi Admin.</p>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {rppList.map((r) => (
            <Card key={r.id} className="p-4 transition-shadow hover:shadow-md">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={STATUS_VARIANT[r.status] ?? "secondary"}>{STATUS_LABEL[r.status] ?? r.status}</Badge>
                    {r.noRpp && (
                      <Badge variant="info" className="font-mono">No. {r.noRpp}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{r.mapel.namaMapel} · {r.kelas.namaKelas}</span>
                  </div>
                  <Link href={`/guru/rpp/${r.id}`} className="block font-semibold text-foreground hover:text-primary mt-1.5 truncate transition-colors">
                    {r.materi}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Alokasi {r.alokasiWaktu} · diperbarui {new Date(r.updatedAt).toLocaleDateString("id-ID")}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Link href={`/guru/rpp/${r.id}/edit`} className="text-primary font-medium hover:underline">Edit</Link>
                  <DeleteButton
                    action={softDeleteRpp.bind(null, r.id)}
                    confirmMessage={`Hapus RPP "${r.materi}"? Bisa dipulihkan dari Sampah Admin.`}
                    label="Hapus"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}