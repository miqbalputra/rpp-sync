// Penanda RPP yang dibuat dari file PDF upload.
import { FileUp } from "lucide-react";

export function UploadBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-transparent bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 ${className}`}>
      <FileUp className="h-3 w-3" /> Upload PDF
    </span>
  );
}
