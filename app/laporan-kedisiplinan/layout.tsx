import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import type { ShellVariant } from "@/components/Sidebar";
import { getNotifikasiDataForSession } from "@/lib/notifikasi/queries";

export const metadata = { title: "Kedisiplinan RPP - Sinkronisasi RPP" };

export default async function DisciplineReportLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const variant: ShellVariant = session?.user?.role === Role.PJ_DINIYYAH ? "pj" : "admin";
  const notifications = await getNotifikasiDataForSession(session);

  return (
    <AppShell variant={variant} user={session?.user} notifications={notifications}>
      {children}
    </AppShell>
  );
}
