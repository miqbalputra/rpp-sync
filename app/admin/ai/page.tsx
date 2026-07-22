// Halaman konfigurasi AI (Admin). API key tidak pernah dikirim ke client —
// hanya status ada/tidak.
import { requireAdmin } from "@/lib/auth-guard";
import { getAiConfigStatus } from "@/lib/ai/client";
import {
  PageHeader, ErrorBanner, SuccessBanner, BackLink,
} from "@/components/admin/ui";
import { AiConfigForm } from "./AiConfigForm";

export const metadata = { title: "Pengaturan AI — Sinkronisasi RPP" };

export default async function PengaturanAiPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireAdmin();
  const { error, ok } = await searchParams;
  const status = await getAiConfigStatus();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackLink href="/admin" />
      <PageHeader
        title="Pengaturan AI"
        subtitle="Konfigurasi endpoint & model untuk pembuatan RPP berbantu AI"
      />
      <ErrorBanner message={error ? decodeURIComponent(error) : null} />
      <SuccessBanner message={ok ? "Pengaturan AI berhasil disimpan." : null} />
      <AiConfigForm status={status} />
    </div>
  );
}