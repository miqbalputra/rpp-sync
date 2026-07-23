"use client";
// Pencarian instant sisi-client untuk daftar RPP Saya.
// Tidak reload & tidak butuh tombol Cari: saat mengetik, baris [data-row] yang
// tidak cocok disembunyikan via inline style.display (mengalahkan kelas Tailwind).
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

export function RppListSearch({
  containerId,
  placeholder = "Cari…",
}: {
  containerId: string;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [visibleCount, setVisibleCount] = useState<number | null>(null);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const term = q.trim().toLowerCase();

    const rows = Array.from(container.querySelectorAll<HTMLElement>("[data-row]"));
    let visible = 0;
    for (const row of rows) {
      const hay = (row.getAttribute("data-search") ?? "").toLowerCase();
      const match = term === "" || hay.includes(term);
      row.style.display = match ? "" : "none";
      if (match) visible++;
    }

    setVisibleCount(term === "" ? null : visible);
  }, [q, containerId]);

  return (
    <div className="mb-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-9 text-sm text-foreground shadow-theme-xs transition focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Bersihkan pencarian"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {visibleCount === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          Tidak ada RPP cocok dengan &quot;{q}&quot;.
        </p>
      )}
    </div>
  );
}