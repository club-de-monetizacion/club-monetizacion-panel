import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function Label({
  className,
  ...props
}: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        "text-xs font-medium uppercase tracking-wide text-[var(--ink-3)]",
        className
      )}
      {...props}
    />
  );
}
