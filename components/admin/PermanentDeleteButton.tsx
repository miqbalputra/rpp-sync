"use client";
// Tombol hapus permanen dengan konfirmasi ganda (PRD §5.6): klik, lalu ketik nama untuk konfirmasi.
import { useState } from "react";

export default function PermanentDeleteButton({
  action,
  confirmName,
  label = "Hapus Permanen",
}: {
  action: (formData: FormData) => Promise<unknown>;
  confirmName: string; // nama materi RPP yang harus diketik persis
  label?: string;
}) {
  const [armed, setArmed] = useState(false);
  const [typed, setTyped] = useState("");

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="text-rose-600 hover:underline"
      >
        {label}
      </button>
    );
  }

  const matches = typed.trim() === confirmName.trim();

  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-rose-200 bg-rose-50 px-2 py-1">
      <input
        autoFocus
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder={`Ketik: ${confirmName}`}
        className="w-40 rounded border border-rose-300 px-2 py-1 text-xs"
      />
      <form
        action={action as unknown as (fd: FormData) => Promise<void>}
        onSubmit={(e) => {
          if (!matches) e.preventDefault();
        }}
      >
        <button
          type="submit"
          disabled={!matches}
          className="rounded bg-rose-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-40"
        >
          Konfirmasi
        </button>
      </form>
      <button
        type="button"
        onClick={() => { setArmed(false); setTyped(""); }}
        className="text-xs text-slate-500 hover:underline"
      >
        Batal
      </button>
    </span>
  );
}