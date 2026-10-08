import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CelebracionGlobal } from "@/components/desafios/celebracion";
import { DesafiosNav } from "@/components/desafios/nav";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Desafíos",
  description: "El reto de los creadores del Club de Monetización.",
  robots: { index: false, follow: false },
};

/**
 * Desafíos tiene su propia cabecera y no la barra lateral del equipo: está pensado para
 * que algún día entren los creadores del Club y solo vean esto. Es un borrador hasta que
 * el subdominio esté aprobado.
 */
export default async function DesafiosLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { user } = session;

  return (
    <div className="relative min-h-screen">
      <DesafiosNav
        esEquipo={user.role === "ADMIN"}
        usuario={{ nombre: user.name ?? null, foto: user.image ?? null, correo: user.email ?? null }}
      />
      <CelebracionGlobal />
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 md:py-8">{children}</main>
    </div>
  );
}
