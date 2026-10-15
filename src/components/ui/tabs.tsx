"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        /* `max-w-full flex-wrap`: con 5 o 6 pestañas la fila medía 600 px y en
           el celular se salía de la pantalla; ahora baja a otra línea. */
        "glass-panel inline-flex max-w-full flex-wrap items-center gap-1 rounded-lg p-1",
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "focus-ring rounded-md px-3 py-1.5 text-sm font-medium text-[var(--ink-2)] transition data-[state=active]:bg-[var(--accent)] data-[state=active]:text-[#1a1200]",
        className
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Content;
