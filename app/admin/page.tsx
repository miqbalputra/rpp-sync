// Dashboard Admin (PRD Tahap 10) — kartu manajemen + statistik sekolah
// (komponen bersama SchoolStatsDashboard, dipakai juga Kepala/PJ).
import { prisma } from "@/lib/db";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Users, BookOpen, School, Trash2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SchoolStatsDashboard } from "@/components/dashboard/SchoolStatsDashboard";

export const metadata = { title: "Dashboard Admin — Sinkronisasi RPP" };

export default async function AdminHomePage() {
  const [userCount, mapelCount, kelasCount, trashUser, trashMapel, trashKelas, trashPenugasan, trashJadwal, trashRpp, rppAktif] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.mapel.count({ where: { deletedAt: null } }),
    prisma.kelas.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: { not: null } } }),
    prisma.mapel.count({ where: { deletedAt: { not: null } } }),
    prisma.kelas.count({ where: { deletedAt: { not: null } } }),
    prisma.penugasan.count({ where: { deletedAt: { not: null } } }),
    prisma.jadwal.count({ where: { deletedAt: { not: null } } }),
    prisma.rpp.count({ where: { deletedAt: { not: null } } }),
    prisma.rpp.count({ where: { deletedAt: null } }),
  ]);

  const totalTrash = trashUser + trashMapel + trashKelas + trashPenugasan + trashJadwal + trashRpp;

  const stats: {
    label: string;
    value: number;
    href: string;
    icon: LucideIcon;
    iconWrap: string;
  }[] = [
    { label: "User", value: userCount, href: "/admin/users", icon: Users, iconWrap: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400" },
    { label: "Mata Pelajaran", value: mapelCount, href: "/admin/mapel", icon: BookOpen, iconWrap: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400" },
    { label: "Kelas", value: kelasCount, href: "/admin/kelas", icon: School, iconWrap: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400" },
    { label: "Item di Sampah", value: totalTrash, href: "/admin/recycle-bin", icon: Trash2, iconWrap: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400" },
  ];

  return (
    <div>
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Admin</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan data sistem · {rppAktif} RPP aktif
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card className="group p-5 transition-all hover:shadow-theme-md hover:-translate-y-0.5 cursor-pointer h-full">
                <div className="flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.iconWrap}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-500" />
                </div>
                <div className="mt-4 text-3xl font-bold tracking-tight text-gray-800 dark:text-white/90">{s.value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{s.label}</div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        <SchoolStatsDashboard linkable showOverviewCards={false} />
      </div>
    </div>
  );
}