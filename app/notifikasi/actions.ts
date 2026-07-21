// Server actions Notifikasi.
// CATATAN: kirimBroadcast & tandai* MENGEMBALIKAN {ok,...} dan TIDAK memanggil redirect()
// (UX pakai Dialog/popover di sisi client). kirimHelp dipakai dari form halaman penuh
// (/akun/bantuan) jadi ia redirect seperti pola createPenugasan.
"use server";
import { prisma } from "@/lib/db";
import { requireUser, requireSender } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { NotifikasiAudience } from "@prisma/client";
import { tandaiDibaca, tandaiSemuaDibaca } from "@/lib/notifikasi/queries";

type ActionResult = { ok: true } | { ok: false; error: string };

const BroadcastSchema = z.object({
  judul: z.string().min(1, "Judul wajib diisi").max(200),
  isi: z.string().min(1, "Isi pesan wajib diisi").max(2000),
  untukRole: z.enum(["SEMUA", "ADMIN", "KEPALA_SEKOLAH", "PJ_DINIYYAH", "GURU"], {
    message: "Audiens tidak valid",
  }),
});

const HelpSchema = z.object({
  tujuan: z.enum(["ADMIN", "PJ_DINIYYAH", "BOTH"], { message: "Tujuan tidak valid" }),
  judul: z.string().min(1, "Judul wajib diisi").max(200),
  isi: z.string().min(1, "Isi pesan wajib diisi").max(2000),
});

export async function kirimBroadcast(formData: FormData): Promise<ActionResult> {
  const session = await requireSender();
  const parsed = BroadcastSchema.safeParse({
    judul: formData.get("judul"),
    isi: formData.get("isi"),
    untukRole: formData.get("untukRole"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const d = parsed.data;
  await prisma.notifikasi.create({
    data: {
      tipe: "BROADCAST",
      dariUserId: session.user.id,
      untukRole: d.untukRole as NotifikasiAudience,
      judul: d.judul.trim(),
      isi: d.isi.trim(),
    },
  });
  revalidatePath("/");
  return { ok: true };
}

export async function kirimHelp(formData: FormData) {
  const session = await requireUser();
  const parsed = HelpSchema.safeParse({
    tujuan: formData.get("tujuan"),
    judul: formData.get("judul"),
    isi: formData.get("isi"),
  });
  if (!parsed.success) {
    redirect(`/akun/bantuan?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }
  const d = parsed.data;
  const targets: NotifikasiAudience[] =
    d.tujuan === "BOTH" ? ["ADMIN", "PJ_DINIYYAH"] : [d.tujuan];
  await prisma.notifikasi.createMany({
    data: targets.map((t) => ({
      tipe: "HELP" as const,
      dariUserId: session.user.id,
      untukRole: t,
      judul: d.judul.trim(),
      isi: d.isi.trim(),
    })),
  });
  revalidatePath("/");
  redirect(`/akun/bantuan?ok=1`);
}

export async function tandaiDibacaAction(notifikasiId: string): Promise<ActionResult> {
  const session = await requireUser();
  await tandaiDibaca(session.user.id, notifikasiId);
  revalidatePath("/");
  return { ok: true };
}

export async function tandaiSemuaDibacaAction(
  notifikasiIds: string[],
): Promise<ActionResult> {
  const session = await requireUser();
  await tandaiSemuaDibaca(session.user.id, notifikasiIds);
  revalidatePath("/");
  return { ok: true };
}