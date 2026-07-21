// Layout Kepala Sekolah: AppShell (sidebar + top bar + bell + account menu).
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { getNotifikasiDataForSession } from "@/lib/notifikasi/queries";

export const metadata = { title: "Kepala Sekolah — Sinkronisasi RPP" };

export default async function KepalaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const notif = await getNotifikasiDataForSession(session);
  return (
    <AppShell variant="kepala" user={session?.user} notifications={notif}>
      {children}
    </AppShell>
  );
}