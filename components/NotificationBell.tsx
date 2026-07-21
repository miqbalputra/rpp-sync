"use client";
// Bell notifikasi di top bar. Data awal di-pass dari server (serializable);
// aksi tandai-baca & kirim broadcast lewat server action + router.refresh().
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, AlertTriangle, CheckCheck, Pencil } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  kirimBroadcast, tandaiSemuaDibacaAction,
} from "@/app/notifikasi/actions";
import { HARI_LABEL, type Hari } from "@/lib/jadwal/schema";

type NotifItem = {
  id: string;
  tipe: "BROADCAST" | "HELP";
  judul: string;
  isi: string;
  createdAt: string;
  dariUser?: { nama: string; role: string } | null;
};

type OverdueAlert = {
  jadwalId: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  mapel: string;
  kelas: string;
  penugasanId: string;
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  KEPALA_SEKOLAH: "Kepala Sekolah",
  PJ_DINIYYAH: "PJ Diniyyah",
  GURU: "Guru",
};

const SENDER_ROLES = new Set(["ADMIN", "KEPALA_SEKOLAH", "PJ_DINIYYAH"]);

function relTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID");
}

export function NotificationBell({
  items,
  unreadCount,
  overdue,
  userRole,
  userId: _userId,
}: {
  items: NotifItem[];
  unreadCount: number;
  overdue: OverdueAlert[];
  userRole: string;
  userId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showCompose, setShowCompose] = useState(false);
  const [sendState, setSendState] = useState<{ ok: boolean; error?: string } | null>(null);

  const isSender = SENDER_ROLES.has(userRole);
  const total = unreadCount + (userRole === "GURU" ? overdue.length : 0);

  const onMarkAll = () => {
    startTransition(async () => {
      await tandaiSemuaDibacaAction(items.map((i) => i.id));
      router.refresh();
    });
  };

  const onSend = async (formData: FormData) => {
    const res = await kirimBroadcast(formData);
    if (res.ok) {
      setSendState(null);
      setShowCompose(false);
      router.refresh();
    } else {
      setSendState({ ok: false, error: res.error });
    }
  };

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Notifikasi"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <Bell className="h-5 w-5" />
            {total > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-semibold text-white">
                {total > 9 ? "9+" : total}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">Notifikasi</span>
            {items.length > 0 && (
              <button
                type="button"
                onClick={onMarkAll}
                disabled={pending || unreadCount === 0}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline disabled:opacity-40 dark:text-brand-400"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Tandai dibaca
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {/* Overdue alerts (guru) */}
            {userRole === "GURU" && overdue.length > 0 && (
              <div className="border-b border-gray-200 bg-warning-50/50 px-4 py-3 dark:border-gray-800 dark:bg-warning-500/[0.07]">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-warning-700 dark:text-warning-400">
                  <AlertTriangle className="h-3.5 w-3.5" /> RPP belum dibuat
                </div>
                <ul className="space-y-1.5">
                  {overdue.map((o) => (
                    <li key={o.jadwalId} className="text-xs text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{o.mapel}</span> — {o.kelas}
                      <span className="text-gray-500 dark:text-gray-400"> · {HARI_LABEL[o.hari as Hari]} {o.jamMulai}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/notifikasi"
                  className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                >
                  Lihat detail
                </Link>
              </div>
            )}

            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Tidak ada notifikasi.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((n) => (
                  <li key={n.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">{n.judul}</span>
                      <Badge variant={n.tipe === "HELP" ? "info" : "secondary"} className="shrink-0">
                        {n.tipe === "HELP" ? "Bantuan" : "Siaran"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">{n.isi}</p>
                    <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                      {n.dariUser?.nama ? `${n.dariUser.nama}` : "Sistem"} · {relTime(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer: compose (senders only) + lihat semua */}
          <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-4 py-2.5 dark:border-gray-800">
            {isSender ? (
              <Dialog open={showCompose} onOpenChange={(o) => { setShowCompose(o); if (!o) setSendState(null); }}>
                <DialogTrigger asChild>
                  <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
                    <Pencil className="h-3.5 w-3.5" /> Tulis pesan
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Kirim Pesan</DialogTitle>
                    <DialogDescription>Broadcast ke audiens yang dipilih. Muncul di notifikasi penerima.</DialogDescription>
                  </DialogHeader>
                  <form action={onSend} className="space-y-3">
                    <div>
                      <label htmlFor="bc-untukRole" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Audiens</label>
                      <select
                        id="bc-untukRole" name="untukRole" required defaultValue="GURU"
                        className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      >
                        <option value="SEMUA">Semua</option>
                        <option value="GURU">Guru</option>
                        <option value="ADMIN">Admin</option>
                        <option value="KEPALA_SEKOLAH">Kepala Sekolah</option>
                        <option value="PJ_DINIYYAH">PJ Diniyyah</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="bc-judul" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Judul</label>
                      <input
                        id="bc-judul" name="judul" required maxLength={200} placeholder="Judul pesan"
                        className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      />
                    </div>
                    <div>
                      <label htmlFor="bc-isi" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Pesan</label>
                      <textarea
                        id="bc-isi" name="isi" required maxLength={2000} rows={4} placeholder="Isi pesan…"
                        className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      />
                    </div>
                    {sendState && !sendState.ok && (
                      <p className="text-xs text-error-600 dark:text-error-400">{sendState.error}</p>
                    )}
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">Batal</Button>
                      </DialogClose>
                      <Button type="submit">Kirim</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            ) : (
              <span />
            )}
            <Link href="/notifikasi" className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
              Lihat semua
            </Link>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}