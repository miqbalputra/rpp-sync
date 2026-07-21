// Loader bersama: siapkan prop form RPP untuk guru login.
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGuruIdFromSession, getOpsiFormGuru, getNamaKepalaSekolah } from "@/lib/rpp/queries";

export async function getRppFormProps() {
  const session = await auth();
  const guruId = await getGuruIdFromSession(session);
  if (!guruId) return null;

  const [{ mapelOptions, kelasByMapel }, namaKepalaSekolah, guru] = await Promise.all([
    getOpsiFormGuru(guruId),
    getNamaKepalaSekolah(),
    prisma.guru.findUnique({ where: { id: guruId } }),
  ]);

  // kelasByMapel (Map) -> plain object agar serializable ke client component
  const kelasByMapelObj: Record<string, { id: string; namaKelas: string; gender: string }[]> = {};
  for (const [mapelId, arr] of kelasByMapel.entries()) {
    kelasByMapelObj[mapelId] = arr.map((k) => ({ id: k.id, namaKelas: k.namaKelas, gender: k.gender }));
  }

  return {
    mapelOptions,
    kelasByMapel: kelasByMapelObj,
    namaKepalaSekolah,
    namaUstadz: guru?.namaTampil ?? session?.user?.name ?? "",
    guruId,
    canCreate: mapelOptions.length > 0,
  };
}