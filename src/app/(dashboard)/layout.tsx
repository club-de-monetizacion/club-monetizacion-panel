import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Providers } from "@/components/providers";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PieDelClub } from "@/components/layout/pie-del-club";
import { VigilaSesion } from "@/components/layout/vigila-sesion";
import { buildThemeVars } from "@/lib/theme";
import { RefrescoVivo } from "@/components/layout/refresco-vivo";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  /* La entrada la resuelve el portero (`authorized` en `auth.ts`) antes de llegar
     aquí. Si aun así no hubiera sesión, /login lo resuelve igual: con la cookie
     del Club entra sola y sin ella va al acceso del Club. Nunca un formulario. */
  if (!session?.user) redirect("/login");

  const { user } = session;
  const themeVars = buildThemeVars(user.accentColor, user.backgroundColor);

  return (
    <div style={themeVars} className="relative min-h-screen">
      {/* El fondo lo pone el cielo del Club desde globals.css: los mismos tres
          gradientes y la misma trama que clubdemonetizacion.com, la Bóveda y
          el Arsenal. */}
      {/* Un solo temporizador para toda la plataforma: lo que cambie en tareas,
          pendientes o lo del equipo aparece sin que nadie recargue. */}
      <RefrescoVivo />
      {/* Si se cierra sesión en el Club o en otra herramienta, aquí también. */}
      <VigilaSesion />
      {/* La huella de la cookie del Club no le hace falta al navegador. */}
      <Providers session={{ ...session, huella: undefined }}>
        <DashboardShell user={user} pie={<PieDelClub />}>
          {children}
        </DashboardShell>
      </Providers>
    </div>
  );
}
