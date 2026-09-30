import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "icon";

/* Los botones del Club: el dorado con su brillo (.btn-oro) y el discreto de borde
   tenue (.btn-fantasma), los mismos del panel y la Bóveda. */
const variants: Record<Variant, string> = {
  primary: "btn-oro",
  secondary: "btn-fantasma bg-white/[0.03] text-[var(--ink-1)]",
  outline: "btn-fantasma",
  ghost: "text-[var(--ink-2)] hover:bg-[var(--panel)] hover:text-[var(--ink-0)]",
  danger:
    "bg-[var(--rojo)]/90 text-white hover:bg-[var(--rojo)] shadow-md shadow-black/20",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  icon: "h-9 w-9",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(({ className, variant = "primary", size = "md", ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "focus-ring inline-flex items-center justify-center rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";
