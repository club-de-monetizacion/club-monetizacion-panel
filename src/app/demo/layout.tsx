import type { ReactNode } from "react";
import { Suspense } from "react";
import { FlaskConical } from "lucide-react";
import { DesafiosNav } from "@/components/desafios/nav";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Demo de Desafíos",
  description: "Así funciona Desafíos, el reto de los creadores del Club de Monetización. Perfiles de ejemplo.",
  robots: { index: false, follow: false },
};

/**
 * La demostración pública de Desafíos: la misma interfaz, pero solo lectura y solo con
 * perfiles inventados, para enseñar cómo funciona sin que haga falta una cuenta. No lleva
 * sesión; el middleware deja pasar `/demo` (ver `authorized` en `src/auth.ts`).
 */
export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <Suspense fallback={<div className="glass-panel h-[57px]" />}>
        <DesafiosNav demo base="/demo" />
      </Suspense>
      <div className="border-b border-sky-400/20 bg-sky-400/10">
        <p className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-2 text-xs text-sky-100 sm:items-center">
          <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:mt-0" />
          <span>
            <strong>Demostración.</strong> Todos los creadores, páginas y cifras son inventados y esto es solo
            lectura: así se ve Desafíos cuando alguien ya lleva días, meses o años en el reto.
          </span>
        </p>
      </div>
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 md:py-8">{children}</main>
    </div>
  );
}
