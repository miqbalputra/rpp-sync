// Layout Guru: sidebar nav.
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { getNotifikasiDataForSession } from "@/lib/notifikasi/queries";

export const metadata = { title: "Guru — Sinkronisasi RPP" };

export default async function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const notif = await getNotifikasiDataForSession(session);
  return (
    <AppShell variant="guru" user={session?.user} notifications={notif}>
      {children}
    </AppShell>
  );
}