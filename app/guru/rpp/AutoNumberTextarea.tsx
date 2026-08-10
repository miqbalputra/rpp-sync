"use client";
// Textarea dengan auto-numbering: ketika guru mengetik baris bernomor
// (mis. "1. langkah") lalu menekan Enter, baris baru otomatis diawali "2. ".
// Bila Enter ditekan di baris bernomor yang kosong, prefix nomor dihapus
// (perilaku "keluar dari list" standar). Mendukung delimiter "." dan ")".
import type { UseFormRegister, UseFormSetValue, FieldPath } from "react-hook-form";
import type { KeyboardEvent } from "react";
import type { RppFormValues } from "@/lib/rpp/schema";

type Props = {
  name: FieldPath<RppFormValues>;
  register: UseFormRegister<RppFormValues>;
  setValue: UseFormSetValue<RppFormValues>;
  className?: string;
  placeholder?: string;
  rows?: number;
};

// Pola awal baris bernomor: "1.", "1. ", "1)", "1) ", "12. ", dst.
const NUM_RE = /^(\d+)([.)])(?:\s+|(?=$))/;

export function AutoNumberTextarea({ name, register, setValue, className, placeholder, rows }: Props) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Hanya Enter polos (tanpa modifier) dan tanpa seleksi teks.
    if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
    const ta = e.currentTarget;
    const { selectionStart, selectionEnd, value } = ta;
    if (selectionStart !== selectionEnd) return;

    // Ambil baris tempat kursor berada.
    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    const lineEnd = value.indexOf("\n", selectionStart);
    const currentLine = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);

    const m = currentLine.match(NUM_RE);
    if (!m) return; // bukan baris bernomor → biarkan Enter biasa

    e.preventDefault();
    const prefix = m[0]; // mis. "1. "
    const num = parseInt(m[1], 10);
    const delim = m[2];

    if (currentLine.slice(prefix.length).trim() === "") {
      // Baris bernomor kosong → hapus prefix (keluar dari list).
      const newVal = value.slice(0, lineStart) + value.slice(lineStart + prefix.length);
      const cursor = lineStart;
      ta.value = newVal;
      ta.selectionStart = ta.selectionEnd = cursor;
      setValue(name, newVal, { shouldDirty: true });
      return;
    }

    // Sisipkan baris baru dengan nomor berikutnya.
    const insert = "\n" + (num + 1) + delim + " ";
    const newVal = value.slice(0, selectionStart) + insert + value.slice(selectionStart);
    const cursor = selectionStart + insert.length;
    ta.value = newVal;
    ta.selectionStart = ta.selectionEnd = cursor;
    setValue(name, newVal, { shouldDirty: true });
  };

  return (
    <textarea
      className={className}
      placeholder={placeholder}
      rows={rows}
      onKeyDown={handleKeyDown}
      {...register(name)}
    />
  );
}
