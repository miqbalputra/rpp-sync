"use client";
// Tombol "Bagikan via WhatsApp" — PRD Tahap 9. Pilih tipe file, lalu buka wa.me.
import { useState } from "react";
import { getShareUrl } from "./actions";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle } from "lucide-react";

export default function ShareButton({ rppId }: { rppId: string }) {
  const [tipe, setTipe] = useState<"image" | "pdf" | "word">("pdf");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function share() {
    setErr(null);
    setLoading(true);
    try {
      const res = await getShareUrl(rppId, tipe);
      if ("url" in res) {
        window.open(res.url, "_blank", "noopener,noreferrer");
      } else {
        setErr(res.error);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={tipe}
        onChange={(e) => setTipe(e.target.value as "image" | "pdf" | "word")}
        className="h-9 rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        title="Tipe file yang dibagikan"
      >
        <option value="image">Gambar</option>
        <option value="pdf">PDF</option>
        <option value="word">Word</option>
      </select>
      <Button type="button" onClick={share} disabled={loading} variant="default">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Menyiapkan…
          </>
        ) : (
          <>
            <MessageCircle className="h-4 w-4" /> Bagikan via WhatsApp
          </>
        )}
      </Button>
      {err && <span className="text-xs text-error-600 dark:text-error-400">{err}</span>}
    </div>
  );
}