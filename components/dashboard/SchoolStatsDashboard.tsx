// Komponen dashboard statistik sekolah — dipakai bersama oleh Admin,
// Kepala Sekolah, dan PJ Diniyyah. Server component (melakukan query sendiri).
//
// - linkable: true untuk Admin (baris terhubung ke halaman manajemen /admin/...).
//   false untuk Kepala/PJ (read-only, baris polos tanpa link ke route admin).
// - showOverviewCards: tampilkan kartu ringkasan (Total RPP/Guru/Mapel/Kelas)
//   di atas — dipakai Kepala/PJ (Admin punya kartu manajemennya sendiri).
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Users, BookOpen, School, Sparkles, Link2, TrendingUp, FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";

type BarRow = { id: string; nama: string; sub?: string; count: number; href: string };

function BarList({ rows, color, linkable }: { rows: BarRow[]; color: string; linkable: boolean }) {
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0);
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada data.</p>;
  }
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const pct = max > 0 ? Math.round((r.count / max) * 100) : 0;
        const inner = (
          <>
            <div className="flex items-center justify-between gap-2 text-sm mb-1">
              <span className="truncate text-foreground">
                {r.nama}
                {r.sub && <span className="text-muted-foreground"> · {r.sub}</span>}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-foreground">{r.count}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
          </>
        );
        const cls = "block rounded-md px-1 -mx-1 py-0.5";
        return linkable ? (
          <Link key={r.id} href={r.href} className={`${cls} transition-colors hover:bg-muted/60`}>
            {inner}
          </Link>
        ) : (
          <div key={r.id} className={cls}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

function OverviewCard({ icon: Icon, value, label, iconWrap }: { icon: LucideIcon; value: number; label: string; iconWrap: string }) {
  return (
    <Card className="p-5 h-full">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconWrap}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight text-gray-800 dark:text-white/90">{value}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </Card>
  );
}

export async function SchoolStatsDashboard({
  linkable = false,
  showOverviewCards = false,
}: {
  linkable?: boolean;
  showOverviewCards?: boolean;
}) {
  const [kelasList, mapelList, guruList, rpps, penugasanList, guruCount] = await Promise.all([
    prisma.kelas.findMany({ where: { deletedAt: null }, select: { id: true, namaKelas: true, gender: true, semester: true } }),
    prisma.mapel.findMany({ where: { deletedAt: null }, select: { id: true, namaMapel: true } }),
    prisma.guru.findMany({ where: { deletedAt: null }, select: { id: true, namaTampil: true } }),
    prisma.rpp.findMany({
      where: { deletedAt: null },
      select: { kelasId: true, mapelId: true, guruId: true, dibuatDenganAI: true, createdAt: true },
    }),
    prisma.penugasan.findMany({
      where: { deletedAt: null, guru: { deletedAt: null }, mapel: { deletedAt: null }, kelas: { deletedAt: null } },
      include: {
        guru: { select: { namaTampil: true } },
        mapel: { select: { namaMapel: true } },
        kelas: { select: { namaKelas: true, gender: true } },
      },
    }),
    prisma.guru.count({ where: { deletedAt: null } }),
  ]);

  const rppAktif = rpps.length;

  const perKelas: BarRow[] = kelasList
    .map((k) => ({
      id: k.id,
      nama: `Kelas ${k.namaKelas}`,
      sub: `${k.gender === "IKHWAN" ? "Ikhwan" : "Akhwat"}${k.semester ? " / " + k.semester : ""}`,
      count: rpps.filter((r) => r.kelasId === k.id).length,
      href: "/admin/kelas",
    }))
    .sort((a, b) => b.count - a.count);

  const perMapel: BarRow[] = mapelList
    .map((m) => ({
      id: m.id,
      nama: m.namaMapel,
      count: rpps.filter((r) => r.mapelId === m.id).length,
      href: "/admin/mapel",
    }))
    .sort((a, b) => b.count - a.count);

  const perGuru: BarRow[] = guruList
    .map((g) => ({
      id: g.id,
      nama: g.namaTampil,
      count: rpps.filter((r) => r.guruId === g.id).length,
      href: "/admin/users",
    }))
    .sort((a, b) => b.count - a.count);

  // RPP AI vs manual.
  const aiCount = rpps.filter((r) => r.dibuatDenganAI).length;
  const manualCount = rppAktif - aiCount;
  const aiPct = rppAktif > 0 ? Math.round((aiCount / rppAktif) * 100) : 0;
  const manualPct = rppAktif > 0 ? 100 - aiPct : 0;

  // Cakupan penugasan vs RPP.
  const uncovered = penugasanList
    .filter(
      (p) =>
        !rpps.some(
          (r) => r.guruId === p.guruId && r.mapelId === p.mapelId && r.kelasId === p.kelasId
        )
    )
    .map((p) => ({
      id: `${p.guruId}-${p.mapelId}-${p.kelasId}`,
      guru: p.guru?.namaTampil ?? "—",
      mapel: p.mapel.namaMapel,
      kelas: `${p.kelas.namaKelas} ${p.kelas.gender === "IKHWAN" ? "Ikhwan" : "Akhwat"}`,
    }));
  const coveredCount = penugasanList.length - uncovered.length;
  const coveredPct = penugasanList.length > 0 ? Math.round((coveredCount / penugasanList.length) * 100) : 0;

  // Trend RPP dibuat per bulan (6 bulan terakhir, termasuk bulan ini).
  const now = new Date();
  const months: { label: string; year: number; month: number; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleDateString("id-ID", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
      count: 0,
    });
  }
  for (const r of rpps) {
    const c = new Date(r.createdAt);
    const mb = months.find((m) => m.year === c.getFullYear() && m.month === c.getMonth());
    if (mb) mb.count++;
  }
  const trendMax = months.reduce((m, x) => Math.max(m, x.count), 0);

  return (
    <div className="space-y-4">
      {showOverviewCards && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <OverviewCard icon={FileText} value={rppAktif} label="RPP Aktif" iconWrap="bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400" />
          <OverviewCard icon={Users} value={guruCount} label="Guru" iconWrap="bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400" />
          <OverviewCard icon={BookOpen} value={mapelList.length} label="Mata Pelajaran" iconWrap="bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400" />
          <OverviewCard icon={School} value={kelasList.length} label="Kelas" iconWrap="bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400" />
        </div>
      )}

      {/* Statistik RPP per kelas / mapel / guru */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <School className="h-4 w-4 text-warning-600" /> RPP per Kelas
            </h2>
            <span className="text-xs text-muted-foreground">{perKelas.length} kelas</span>
          </div>
          <BarList rows={perKelas} color="bg-warning-500" linkable={linkable} />
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <BookOpen className="h-4 w-4 text-success-600" /> RPP per Mapel
            </h2>
            <span className="text-xs text-muted-foreground">{perMapel.length} mapel</span>
          </div>
          <BarList rows={perMapel} color="bg-success-500" linkable={linkable} />
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4 text-brand-600" /> RPP per Guru
            </h2>
            <span className="text-xs text-muted-foreground">{perGuru.length} guru</span>
          </div>
          <BarList rows={perGuru} color="bg-brand-500" linkable={linkable} />
        </Card>
      </div>

      {/* AI vs manual & cakupan penugasan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-brand-600" /> RPP AI vs Manual
            </h2>
            <span className="text-xs text-muted-foreground">{rppAktif} RPP</span>
          </div>
          {rppAktif === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada RPP.</p>
          ) : (
            <>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand-500" />
                  <span className="font-semibold tabular-nums text-foreground">{aiCount}</span>
                  <span className="text-muted-foreground">AI</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span className="font-semibold tabular-nums text-foreground">{manualCount}</span>
                  <span className="text-muted-foreground">Manual</span>
                </span>
              </div>
              <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="bg-brand-500" style={{ width: `${aiPct}%` }} />
                <div className="bg-gray-300 dark:bg-gray-600" style={{ width: `${manualPct}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>AI {aiPct}%</span>
                <span>Manual {manualPct}%</span>
              </div>
            </>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Link2 className="h-4 w-4 text-success-600" /> Cakupan Penugasan vs RPP
            </h2>
            <span className="text-xs text-muted-foreground">{penugasanList.length} penugasan</span>
          </div>
          {penugasanList.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada penugasan.</p>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Sudah punya RPP</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {coveredCount}/{penugasanList.length}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-success-500" style={{ width: `${coveredPct}%` }} />
              </div>
              {uncovered.length > 0 ? (
                <ul className="mt-4 space-y-1.5">
                  <li className="text-xs font-medium text-muted-foreground">
                    Belum punya RPP ({uncovered.length}):
                  </li>
                  {uncovered.slice(0, 6).map((u) => (
                    <li key={u.id} className="truncate text-sm text-foreground">
                      • {u.guru} · {u.mapel} · {u.kelas}
                    </li>
                  ))}
                  {uncovered.length > 6 && (
                    <li className="text-xs text-muted-foreground">+{uncovered.length - 6} lainnya</li>
                  )}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-success-600 dark:text-success-400">
                  Semua penugasan sudah punya RPP. 🎉
                </p>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Trend RPP per bulan */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <TrendingUp className="h-4 w-4 text-brand-600" /> RPP Dibuat per Bulan
          </h2>
          <span className="text-xs text-muted-foreground">6 bulan terakhir</span>
        </div>
        <div className="flex items-end gap-3">
          {months.map((mb) => {
            const h = trendMax > 0 ? Math.round((mb.count / trendMax) * 100) : 0;
            return (
              <div key={`${mb.year}-${mb.month}`} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-semibold tabular-nums text-foreground">{mb.count}</span>
                <div className="flex h-28 w-full items-end justify-center">
                  <div
                    className="w-full max-w-[26px] rounded-t-md bg-brand-500 transition-all"
                    style={{ height: `${Math.max(h, 0)}%` }}
                    title={`${mb.count} RPP`}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{mb.label}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}