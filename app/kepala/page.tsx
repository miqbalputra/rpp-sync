// Dashboard Kepala Sekolah (placeholder v1.2). Chrome (header/sidebar/bell) disediakan layout.
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Hammer } from "lucide-react";

export default async function KepalaHomePage() {
  const session = await auth();
  return (
    <div className="max-w-3xl">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Kepala Sekolah</h1>
        <p className="text-sm text-muted-foreground">Halo, {session?.user?.name ?? ""}</p>
      </div>
      <Card className="p-8 border-dashed text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
          <Hammer className="h-7 w-7" />
        </div>
        <p className="font-semibold text-foreground">Fitur ini akan aktif penuh di v1.2</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Lihat seluruh RPP (read-only), beri tanda tangan / approval, dan lihat laporan rekap
          kepatuhan pembuatan RPP per periode.
        </p>
      </Card>
    </div>
  );
}