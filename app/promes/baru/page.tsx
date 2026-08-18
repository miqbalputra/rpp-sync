import { requireAdminOrPj } from "@/lib/auth-guard";
import { getPromesFormOptions } from "@/lib/promes/queries";
import { createPromes } from "../actions";
import PromesForm from "../PromesForm";

export const metadata = { title: "Tambah Promes — Sinkronisasi RPP" };

export default async function NewPromesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdminOrPj();
  const [{ mapel, kelas }, params] = await Promise.all([getPromesFormOptions(), searchParams]);
  return <PromesForm mapel={mapel} kelas={kelas} action={createPromes} error={params.error ? decodeURIComponent(params.error) : undefined} title="Tambah Promes" />;
}
