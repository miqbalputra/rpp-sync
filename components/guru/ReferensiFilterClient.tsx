"use client";
// Filter sisi-client untuk pustaka Referensi RPP.
// Tidak memuat ulang data: cukup menampilkan/ menyembunyikan baris & grup yang
// sudah di-render server, berdasarkan atribut data-search pada tiap baris RPP.
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

export function ReferensiFilterClient({ containerId }: { containerId: string }) {
  const [q, setQ] = useState("");
  const [visibleCount, setVisibleCount] = useState<number | null>(null);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const term = q.trim().toLowerCase();

    // Pakai inline style.display (bukan atribut hidden) karena baris RPP memakai
    // kelas Tailwind `flex` yang spesifisitasnya mengalahkan `[hidden]{display:none}`,
    // sehingga atribut hidden tidak benar-benar menyembunyikan elemen.
    const show = (el: HTMLElement, on: boolean) => {
      el.style.display = on ? "" : "none";
    };

    // 1) Baris RPP.
    const rows = Array.from(container.querySelectorAll<HTMLElement>("[data-row]"));
    let visible = 0;
    for (const row of rows) {
      const hay = (row.getAttribute("data-search") ?? "").toLowerCase();
      const match = term === "" || hay.includes(term);
      show(row, match);
      if (match) visible++;
    }
    // 2) Grup mapel: sembunyikan bila tak ada baris terlihat di dalamnya.
    const mapelGroups = Array.from(container.querySelectorAll<HTMLElement>('[data-group="mapel"]'));
    for (const mg of mapelGroups) {
      const hasVisible = Array.from(mg.querySelectorAll<HTMLElement>("[data-row]")).some(
        (r) => r.style.display !== "none"
      );
      show(mg, hasVisible);
    }
    // 3) Grup kelas: sembunyikan bila tak ada mapel terlihat di dalamnya.
    const kelasGroups = Array.from(container.querySelectorAll<HTMLElement>('[data-group="kelas"]'));
    for (const kg of kelasGroups) {
      const hasVisible = Array.from(kg.querySelectorAll<HTMLElement>('[data-group="mapel"]')).some(
        (m) => m.style.display !== "none"
      );
      show(kg, hasVisible);
    }

    setVisibleCount(term === "" ? null : visible);
  }, [q, containerId]);

  return (
    <div className="mb-4 sticky top-2 z-10">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari: nama ustadz, mapel, materi, No. RPP…"
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm text-foreground outline-none transition-colors focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900"
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
          Tidak ada RPP yang cocok dengan &quot;{q}&quot;.
        </p>
      )}
    </div>
  );
}