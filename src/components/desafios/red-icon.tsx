import type { RedSocial } from "@prisma/client";
import { RED_INFO } from "@/lib/desafios";
import { cn } from "@/lib/utils";

/**
 * El logo de una red. Las cuatro están en /public/branding/platforms, así que se pinta la
 * imagen directamente: pasando por `PlatformIcon` se veía un instante el emoji de
 * reserva antes de que cargara el logo.
 */
export function RedIcon({ red, className }: { red: RedSocial; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/branding/platforms/${red.toLowerCase()}.png`}
      alt={RED_INFO[red].nombre}
      className={cn("object-contain", className)}
    />
  );
}
