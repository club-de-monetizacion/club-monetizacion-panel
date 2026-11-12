import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { misPendientes } from "@/app/actions/pendientes";
import { PendientesBoard } from "@/components/pendientes/pendientes-board";
import { RefrescoVivo } from "@/components/layout/refresco-vivo";
import { VigilaSesion } from "@/components/layout/vigila-sesion";
import { buildThemeVars } from "@/lib/theme";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Captura rápida" };

/**
 * La captura rápida de la app de escritorio (11 nov 2026): lo que se abre al tocar el botón
 * flotante o con ⌘⇧Espacio. Son los mismos Pendientes de /pendientes —la misma caja de
 * «¿Qué se te acaba de ocurrir?» y la misma lista—, sin el menú ni la cabecera, en una
 * ventanita. La franja de arriba sirve para mover la ventana (en el Mac deja sitio a los
 * tres botones de la ventana).
 */
export default async function CapturaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const pendientes = await misPendientes();
  const themeVars = buildThemeVars(session.user.accentColor, session.user.backgroundColor);
  const arrastre = { WebkitAppRegion: "drag" } as CSSProperties;

  return (
    <div style={themeVars} className="relative min-h-screen">
      <RefrescoVivo />
      <VigilaSesion />
      <div
        style={arrastre}
        className="sticky top-0 z-20 flex h-10 items-center justify-center border-b border-[var(--linea)] bg-[#05091a]/90 pl-[78px] pr-3 backdrop-blur-md"
      >
        <p className="truncate text-[10px] font-semibold tracking-[0.22em] text-[var(--oro)] uppercase">
          Pendientes · captura rápida
        </p>
      </div>
      <main className="px-3 pt-3 pb-5">
        <PendientesBoard inicial={pendientes} />
      </main>
    </div>
  );
}
