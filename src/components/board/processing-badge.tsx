import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small animated indicator used wherever a video is in the "Editando"
 * stage, to visually signal that it's actively being worked on. */
export function ProcessingBadge({
  compact,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <Loader2 className={cn("h-3 w-3 animate-spin text-[var(--accent)]", className)} />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]",
        className
      )}
    >
      <Loader2 className="h-3 w-3 animate-spin" />
      Procesando
    </span>
  );
}
