import { CheckCircle2, Download, ImageDown, Medal, Trophy, TriangleAlert, Users, type LucideIcon } from "lucide-react";
import { requireAdminOrPj } from "@/lib/auth-guard";
import { getRppDisciplineReport, type RppDisciplineEntry } from "@/lib/discipline-rpp/queries";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const metadata = { title: "Kedisiplinan RPP - Sinkronisasi RPP" };

function statusBadge(entry: RppDisciplineEntry) {
  if (entry.status === "LENGKAP") return <Badge variant="success">Sudah lengkap</Badge>;
  if (entry.status === "TANPA_PENUGASAN") return <Badge variant="secondary">Belum ada penugasan</Badge>;
  return <Badge variant="warning">Belum lengkap</Badge>;
}

export default async function DisciplineReportPage() {
  await requireAdminOrPj();
  const report = await getRppDisciplineReport();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kedisiplinan Pembuatan RPP"
        subtitle="Peringkat dihitung dari cakupan RPP terhadap penugasan aktif setiap guru."
        action={
          <div className="flex flex-wrap gap-2">
            <a href="/api/laporan-kedisiplinan?format=image" className={cn(buttonVariants({ variant: "outline" }))}>
              <ImageDown className="h-4 w-4" /> Unduh Gambar
            </a>
            <a href="/api/laporan-kedisiplinan?format=pdf" className={cn(buttonVariants({ variant: "default" }))}>
              <Download className="h-4 w-4" /> Unduh PDF
            </a>
          </div>
        }
      />

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
        <div className="flex gap-3">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p><strong>Pengingat untuk Guru:</strong> Guru dengan status belum lengkap perlu segera membuat atau mengunggah RPP untuk penugasan Mapel dan Kelas yang masih kosong. File PDF dan gambar di atas siap dibagikan.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard icon={CheckCircle2} label="Guru lengkap" value={report.summary.guruLengkap} tone="success" />
        <SummaryCard icon={TriangleAlert} label="Perlu melengkapi" value={report.summary.guruBelumLengkap} tone="warning" />
        <SummaryCard icon={Trophy} label="Penugasan terisi RPP" value={`${report.summary.penugasanSudahPunyaRpp}/${report.summary.totalPenugasan}`} tone="brand" />
        <SummaryCard icon={Users} label="Guru aktif" value={report.summary.totalGuru} tone="neutral" />
      </div>

      <Card className="p-0">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="flex items-center gap-2 font-semibold text-foreground"><Trophy className="h-5 w-5 text-amber-500" />Leaderboard Kedisiplinan</h2>
          <span className="text-xs text-muted-foreground">{report.summary.guruDinilai} guru dinilai</span>
        </div>
        {report.leaderboard.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Belum ada penugasan aktif untuk dinilai.</p>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Peringkat</TableHead><TableHead>Guru</TableHead><TableHead>Cakupan RPP</TableHead><TableHead>Skor</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {report.leaderboard.map((entry) => (
                <TableRow key={entry.guruId}>
                  <TableCell className="font-bold text-brand-600 dark:text-brand-400"><span className="inline-flex items-center gap-1"><Medal className="h-4 w-4" />{entry.rank}</span></TableCell>
                  <TableCell className="font-medium text-foreground">{entry.namaGuru}</TableCell>
                  <TableCell className="tabular-nums text-foreground">{entry.rppSudahDibuat}/{entry.totalPenugasan}</TableCell>
                  <TableCell className="min-w-36"><div className="flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand-500" style={{ width: `${entry.persentase ?? 0}%` }} /></div><span className="w-9 text-right text-xs font-semibold tabular-nums text-foreground">{entry.persentase}%</span></div></TableCell>
                  <TableCell>{statusBadge(entry)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-0">
        <div className="flex flex-col gap-1 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="font-semibold text-foreground">Rincian Kelengkapan RPP Guru</h2>
          <p className="text-sm text-muted-foreground">Termasuk daftar Mapel dan Kelas yang belum memiliki RPP.</p>
        </div>
        {report.entries.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Belum ada Guru aktif.</p>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Guru</TableHead><TableHead className="text-center">RPP</TableHead><TableHead>Skor</TableHead><TableHead>Status</TableHead><TableHead>Masih perlu dilengkapi</TableHead></TableRow></TableHeader>
            <TableBody>
              {report.entries.map((entry) => (
                <TableRow key={entry.guruId}>
                  <TableCell><div className="font-medium text-foreground">{entry.namaGuru}</div>{entry.rank && <p className="mt-0.5 text-xs text-muted-foreground">Peringkat #{entry.rank}</p>}</TableCell>
                  <TableCell className="text-center tabular-nums text-foreground">{entry.rppSudahDibuat}/{entry.totalPenugasan}</TableCell>
                  <TableCell className="font-medium tabular-nums text-foreground">{entry.persentase === null ? "-" : `${entry.persentase}%`}</TableCell>
                  <TableCell>{statusBadge(entry)}</TableCell>
                  <TableCell className="min-w-64">
                    {entry.missing.length === 0 ? <span className="text-sm text-success-600 dark:text-success-400">Tidak ada</span> : <ul className="space-y-1 text-sm text-foreground">{entry.missing.map((item) => <li key={`${item.mapel}-${item.kelas}-${item.gender}`}>- {item.mapel} - {item.kelas} ({item.gender === "IKHWAN" ? "Ikhwan" : "Akhwat"})</li>)}</ul>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string | number; tone: "success" | "warning" | "brand" | "neutral" }) {
  const styles = {
    success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400",
    warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400",
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
    neutral: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  };
  return <Card className="p-5"><div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", styles[tone])}><Icon className="h-5 w-5" /></div><div className="mt-4 text-3xl font-bold tracking-tight text-foreground">{value}</div><div className="mt-1 text-sm text-muted-foreground">{label}</div></Card>;
}
