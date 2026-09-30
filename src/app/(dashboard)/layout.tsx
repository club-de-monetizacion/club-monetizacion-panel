import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Providers } from "@/components/providers";
import { AnimatedBackground } from "@/components/layout/animated-background";
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
      <AnimatedBackground
        type={user.backgroundType}
        color={user.backgroundColor}
        accent={user.accentColor}
        animated={user.particlesEnabled}
      />
      {/* Un solo temporizador para toda la plataforma: lo que cambie en tareas,
          pendientes o lo del equipo aparece sin que nadie recargue. */}
      <RefrescoVivo />
      <Providers>
        <DashboardShell user={user}>{children}</DashboardShell>
      </Providers>
    </div>
  );
}
