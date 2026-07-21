// Layout Admin: sidebar nav ke master data, recycle bin, dashboard.
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { getNotifikasiDataForSession } from "@/lib/notifikasi/queries";

export const metadata = { title: "Admin — Sinkronisasi RPP" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const notif = await getNotifikasiDataForSession(session);
  return (
    <AppShell variant="admin" user={session?.user} notifications={notif}>
      {children}
    </AppShell>
  );
}