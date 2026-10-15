"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type ComponentProps } from "react";

/**
 * El enlace de toda la plataforma: un `<Link>` de Next que adelanta la página
 * solo cuando hay intención de abrirla (ratón encima, foco o dedo encima).
 *
 * ⚠️ NO usar `<Link>` a secas. Con el prefetch automático cada enlace visible
 * pedía su página al servidor al cargar y OTRA VEZ tras cada refresco vivo
 * (RefrescoVivo, cada 15 s): 13-15 peticiones por tic, unas 3.400 por hora y
 * pestaña, cada una pasando por el portero y el layout con `auth()`. Así queda
 * una sola petición por tic (el propio refresco) y el clic sigue siendo
 * instantáneo porque la página ya se pidió al acercar el ratón o el dedo.
 */
export function Enlace({
  href,
  onMouseEnter,
  onTouchStart,
  onFocus,
  ...props
}: ComponentProps<typeof Link>) {
  const router = useRouter();
  const ultimo = useRef(0);

  const adelanta = () => {
    if (typeof href !== "string") return;
    // Una vez cada 30 s como mucho: pasar el ratón por el menú no es una ráfaga.
    const ahora = Date.now();
    if (ahora - ultimo.current < 30000) return;
    ultimo.current = ahora;
    router.prefetch(href);
  };

  return (
    <Link
      {...props}
      href={href}
      prefetch={false}
      onMouseEnter={(e) => {
        adelanta();
        onMouseEnter?.(e);
      }}
      onTouchStart={(e) => {
        adelanta();
        onTouchStart?.(e);
      }}
      onFocus={(e) => {
        adelanta();
        onFocus?.(e);
      }}
    />
  );
}
