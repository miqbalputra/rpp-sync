import { Download, FileText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function UploadedRppView({ rppId, fileName }: { rppId: string; fileName: string }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-500/30 dark:bg-blue-500/10">
        <div className="flex min-w-0 items-center gap-2 text-sm text-blue-900 dark:text-blue-200">
          <FileText className="h-5 w-5 shrink-0" />
          <span className="truncate font-medium">{fileName}</span>
        </div>
        <a
          href={`/api/rpp/${rppId}/file?download=1`}
          className={cn(buttonVariants({ variant: "default", size: "sm" }))}
        >
          <Download className="h-4 w-4" /> Download PDF
        </a>
      </div>
      <iframe
        src={`/api/rpp/${rppId}/file`}
        title={`Pratinjau ${fileName}`}
        className="h-[70vh] min-h-[560px] w-full rounded-lg border border-border bg-muted"
      />
    </div>
  );
}
