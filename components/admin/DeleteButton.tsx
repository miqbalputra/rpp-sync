"use client";
// Tombol hapus dengan dialog konfirmasi (AlertDialog) — memanggil server action.
import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogFooter, AlertDialogTitle, AlertDialogDescription,
  AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export default function DeleteButton({
  action,
  label = "Hapus",
  confirmMessage,
  className = "",
  withIcon = false,
}: {
  action: (formData: FormData) => Promise<unknown>;
  label?: string;
  confirmMessage: string;
  className?: string;
  /** Tampilkan ikon tong sampah sebelum label. */
  withIcon?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-700 hover:underline transition-colors ${className}`}
        >
          {withIcon && <Trash2 className="h-3.5 w-3.5" />}
          {label}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
          <AlertDialogDescription>{confirmMessage}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <form action={action as unknown as (fd: FormData) => Promise<void>}>
            <AlertDialogAction type="submit">Hapus</AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}