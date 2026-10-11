import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Providers } from "@/components/providers";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { buildThemeVars } from "@/lib/theme";
import { RefrescoVivo } from "@/components/layout/refresco-vivo";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { user } = session;
  const themeVars = buildThemeVars(user.accentColor, user.backgroundColor);

  return (
    <div style={themeVars} className="relative min-h-screen">
      {/* El fondo lo pone el cielo del Club desde globals.css: los mismos tres
          gradientes y la misma trama que clubdemonetizacion.com, la Bóveda y
          el Arsenal. Antes aquí se pintaban partículas y auroras en movimiento,
          y el panel parecía de otra plataforma. */}
      {/* Un solo temporizador para toda la plataforma: lo que cambie en tareas,
          pendientes o lo del equipo aparece sin que nadie recargue. */}
      <RefrescoVivo />
      <Providers>
        <DashboardShell user={user}>{children}</DashboardShell>
      </Providers>
    </div>
  );
}
