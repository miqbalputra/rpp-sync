"use client";
// Form upload file .xlsx untuk import guru. Memanggil server action importGuru
// dan menampilkan ringkasan created/skipped/errors.
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { importGuru, type ImportGuruResult } from "@/app/admin/users/actions";
import { Button } from "@/components/admin/ui";

export default function GuruImportForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportGuruResult | null>(null);
  const [fileName, setFileName] = useState<string>("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setResult({ ok: false, created: 0, skipped: 0, errors: [{ row: 0, message: "Pilih file .xlsx dulu" }] });
      return;
    }
    setResult(null);
    startTransition(async () => {
      const res = await importGuru(formData);
      setResult(res);
      form.reset();
      setFileName("");
      if (res.ok && res.created > 0) router.refresh();
    });
  }

  const inputCls =
    "w-full h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs transition focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="file" className="block text-sm font-medium text-foreground mb-1.5">
          File Excel (.xlsx)
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          required
          disabled={isPending}
          className={inputCls + " file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"}
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
        />
        {fileName && <p className="text-xs text-muted-foreground mt-1.5">Terpilih: {fileName}</p>}
      </div>

      <div className="flex gap-2">
        <Button type="submit">{isPending ? "Mengimpor…" : "Import"}</Button>
      </div>

      {result && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm space-y-2">
          {result.ok ? (
            <p className="font-medium text-foreground">
              Import selesai: <span className="text-success-600 dark:text-success-400">{result.created} dibuat</span>
              , {result.skipped} dilewati
              {result.errors.length > 0 ? `, ${result.errors.length} catatan` : ""}
            </p>
          ) : (
            <p className="font-medium text-error-600 dark:text-error-400">Import gagal.</p>
          )}

          {result.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Catatan / error:</p>
              <ul className="max-h-48 overflow-auto space-y-1 text-xs">
                {result.errors.map((er, i) => (
                  <li key={i} className="text-foreground">
                    {er.row > 0 ? <span className="font-mono text-muted-foreground">baris {er.row}: </span> : null}
                    {er.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </form>
  );
}