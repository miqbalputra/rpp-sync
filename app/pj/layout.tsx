// Layout PJ Diniyyah: AppShell (sidebar + top bar + bell + account menu).
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { getNotifikasiDataForSession } from "@/lib/notifikasi/queries";

export const metadata = { title: "PJ Diniyyah — Sinkronisasi RPP" };

export default async function PjLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const notif = await getNotifikasiDataForSession(session);
  return (
    <AppShell variant="pj" user={session?.user} notifications={notif}>
      {children}
    </AppShell>
  );
}