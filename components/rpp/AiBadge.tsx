// Penanda "Dibantu AI" untuk RPP yang dibuat lewat flow AI.
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-transparent bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
        className,
      )}
    >
      <Sparkles className="h-3 w-3" /> Dibantu AI
    </span>
  );
}