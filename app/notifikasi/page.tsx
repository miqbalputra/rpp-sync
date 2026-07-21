// Kotak masuk Notifikasi (semua role) + pesan terkirim (sender).
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getNotifikasiDataForSession, getNotifikasiTerkirim } from "@/lib/notifikasi/queries";
import { HARI_LABEL, type Hari } from "@/lib/jadwal/schema";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Inbox, Send, Clock } from "lucide-react";

export const metadata = { title: "Notifikasi — Sinkronisasi RPP" };

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  KEPALA_SEKOLAH: "Kepala Sekolah",
  PJ_DINIYYAH: "PJ Diniyyah",
  GURU: "Guru",
  SEMUA: "Semua",
};

const SENDER_ROLES = new Set(["ADMIN", "KEPALA_SEKOLAH", "PJ_DINIYYAH"]);

export default async function NotifikasiPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { items, unreadCount, overdue } = await getNotifikasiDataForSession(session);

  const isSender = SENDER_ROLES.has(session.user.role);
  const terkirim = isSender ? await getNotifikasiTerkirim(session.user.id) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Notifikasi"
        subtitle={unreadCount > 0 ? `${unreadCount} pesan belum dibaca` : "Tidak ada pesan baru"}
      />

      {overdue.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-warning-700 dark:text-warning-400">
            <AlertTriangle className="h-4 w-4" /> Pengingat RPP
          </h2>
          <ul className="space-y-2">
            {overdue.map((o) => (
              <li key={o.jadwalId} className="flex items-center justify-between gap-2 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm dark:border-warning-500/30 dark:bg-warning-500/15">
                <span className="text-warning-800 dark:text-warning-400">
                  RPP <strong>{o.mapel}</strong> — {o.kelas} belum dibuat (jadwal {HARI_LABEL[o.hari as Hari]} {o.jamMulai}).
                </span>
                <Badge variant="warning" className="shrink-0">RPP belum dibuat</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Kotak masuk */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300">
              <Inbox className="h-5 w-5" />
            </span>
            <div className="space-y-0.5">
              <CardTitle>Kotak Masuk</CardTitle>
              <CardDescription>Pesan yang ditujukan kepada Anda.</CardDescription>
            </div>
          </div>
          {unreadCount > 0 && (
            <Badge variant="danger" className="px-2.5 py-1">{unreadCount} baru</Badge>
          )}
        </CardHeader>
        {items.length === 0 ? (
          <EmptyState>Belum ada notifikasi.</EmptyState>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((n) => (
              <li key={n.id} className="px-6 py-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{n.judul}</span>
                  <Badge variant={n.tipe === "HELP" ? "info" : "secondary"} className="shrink-0">
                    {n.tipe === "HELP" ? "Bantuan" : "Siaran"}
                  </Badge>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{n.isi}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {n.dariUser?.nama
                    ? `dari ${n.dariUser.nama}${n.dariUser.role ? ` (${ROLE_LABEL[n.dariUser.role] ?? n.dariUser.role})` : ""}`
                    : "Sistem"}
                  {" · "}
                  {new Date(n.createdAt).toLocaleString("id-ID")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Pesan terkirim (sender: Admin / Kepala / PJ) */}
      {isSender && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                <Send className="h-5 w-5" />
              </span>
              <div className="space-y-0.5">
                <CardTitle>Pesan Terkirim</CardTitle>
                <CardDescription>Siaran &amp; bantuan yang Anda buat.</CardDescription>
              </div>
            </div>
            {terkirim.length > 0 && (
              <Badge variant="secondary" className="px-2.5 py-1">{terkirim.length} pesan</Badge>
            )}
          </CardHeader>
          {terkirim.length === 0 ? (
            <EmptyState>Belum ada pesan terkirim. Gunakan “Tulis pesan” di lonceng notifikasi.</EmptyState>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {terkirim.map((n) => (
                <li key={n.id} className="px-6 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-foreground">{n.judul}</span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge variant={n.tipe === "HELP" ? "info" : "secondary"}>
                        {n.tipe === "HELP" ? "Bantuan" : "Siaran"}
                      </Badge>
                      <Badge variant="outline">
                        ke {ROLE_LABEL[n.untukRole ?? ""] ?? n.untukRole ?? "—"}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{n.isi}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(n.createdAt).toLocaleString("id-ID")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}