import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  color,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { color?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        className
      )}
      style={
        color
          ? {
              backgroundColor: `${color}22`,
              color,
            }
          : undefined
      }
      {...props}
    >
      {children}
    </span>
  );
}
