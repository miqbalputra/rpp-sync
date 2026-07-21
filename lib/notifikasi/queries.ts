// Query notifikasi + data serializable untuk NotificationBell (client).
import { prisma } from "@/lib/db";
import { Prisma, Role, NotifikasiAudience } from "@prisma/client";
import type { Session } from "next-auth";
import { getGuruIdFromSession } from "@/lib/rpp/queries";
import { getOverdueAlertsForGuru, type OverdueAlert } from "@/lib/jadwal/queries";

type UserLike = { id: string; role: Role };

/** Filter audiens: SEMUA, atau role user, atau ditujukan langsung ke user. */
function audienceWhere(user: UserLike): Prisma.NotifikasiWhereInput {
  return {
    OR: [
      { untukRole: "SEMUA" },
      { untukRole: user.role as NotifikasiAudience },
      { untukUserId: user.id },
    ],
  };
}

export async function getNotifikasiForUser(user: UserLike) {
  return prisma.notifikasi.findMany({
    where: audienceWhere(user),
    include: { dariUser: { select: { nama: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export async function getUnreadCount(user: UserLike): Promise<number> {
  return prisma.notifikasi.count({
    where: {
      AND: [audienceWhere(user), { NOT: { dibaca: { some: { userId: user.id } } } }],
    },
  });
}

export async function getOverdueForUser(session: Session | null): Promise<OverdueAlert[]> {
  if (!session?.user || session.user.role !== Role.GURU) return [];
  const pref = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { prefNotifOverdue: true },
  });
  if (!pref?.prefNotifOverdue) return [];
  const guruId = await getGuruIdFromSession(session);
  if (!guruId) return [];
  return getOverdueAlertsForGuru(guruId);
}

export async function tandaiDibaca(userId: string, notifikasiId: string) {
  await prisma.notifikasiDibaca.upsert({
    where: { userId_notifikasiId: { userId, notifikasiId } },
    create: { userId, notifikasiId },
    update: {},
  });
}

export async function tandaiSemuaDibaca(userId: string, notifikasiIds: string[]) {
  if (notifikasiIds.length === 0) return;
  await prisma.$transaction(
    notifikasiIds.map((id) =>
      prisma.notifikasiDibaca.upsert({
        where: { userId_notifikasiId: { userId, notifikasiId: id } },
        create: { userId, notifikasiId: id },
        update: {},
      }),
    ),
  );
}

/** Pesan yang dibuat (dikirim) oleh user — siaran & bantuan. */
export async function getNotifikasiTerkirim(userId: string) {
  return prisma.notifikasi.findMany({
    where: { dariUserId: userId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, tipe: true, judul: true, isi: true, untukRole: true, createdAt: true },
  });
}

// --- Tipe serializable untuk NotificationBell (client) ---

export type NotifItem = {
  id: string;
  tipe: "BROADCAST" | "HELP";
  judul: string;
  isi: string;
  createdAt: string; // ISO
  dariUser?: { nama: string; role: string } | null;
};

export type NotifData = {
  items: NotifItem[];
  unreadCount: number;
  overdue: OverdueAlert[];
};

/** Dipakai semua layout: kirim data awal notifikasi ke NotificationBell. */
export async function getNotifikasiDataForSession(
  session: Session | null,
): Promise<NotifData> {
  if (!session?.user) {
    return { items: [], unreadCount: 0, overdue: [] };
  }
  const [rows, unreadCount, overdue] = await Promise.all([
    getNotifikasiForUser(session.user),
    getUnreadCount(session.user),
    getOverdueForUser(session),
  ]);
  const items: NotifItem[] = rows.map((r) => ({
    id: r.id,
    tipe: r.tipe,
    judul: r.judul,
    isi: r.isi,
    createdAt: r.createdAt.toISOString(),
    dariUser: r.dariUser
      ? { nama: r.dariUser.nama, role: String(r.dariUser.role) }
      : null,
  }));
  return { items, unreadCount, overdue };
}