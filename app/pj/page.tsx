// Dashboard PJ Diniyyah / Kurikulum — statistik sekolah (read-only oversight).
// Memakai komponen bersama SchoolStatsDashboard dengan kartu overview;
// baris tidak ter-link ke route manajemen admin (linkable=false).
import { auth } from "@/lib/auth";
import { SchoolStatsDashboard } from "@/components/dashboard/SchoolStatsDashboard";

export const metadata = { title: "Dashboard PJ Diniyyah — Sinkronisasi RPP" };

export default async function PjHomePage() {
  const session = await auth();
  return (
    <div>
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard PJ Diniyyah (Kurikulum)</h1>
        <p className="text-sm text-muted-foreground">
          Statistik RPP sekolah (read-only) · Halo, {session?.user?.name ?? ""}
        </p>
      </div>
      <SchoolStatsDashboard linkable={false} showOverviewCards />
    </div>
  );
}