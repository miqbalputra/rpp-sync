import { ExternalLink, Link2 } from "lucide-react";

export function PromesLinkCard({
  mapelNama,
  kelasNama,
  url,
}: {
  mapelNama: string;
  kelasNama: string;
  url?: string | null;
}) {
  return url ? (
    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-500/30 dark:bg-blue-500/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2 text-sm text-blue-900 dark:text-blue-200">
          <Link2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0">
            <p className="font-medium">Promes {mapelNama} — {kelasNama}</p>
            <p className="mt-0.5 truncate text-xs text-blue-800/75 dark:text-blue-200/75">{url}</p>
          </div>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" /> Lihat Promes
        </a>
      </div>
    </div>
  ) : (
    <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400">
      Promes untuk Mapel dan Kelas ini belum tersedia.
    </div>
  );
}
