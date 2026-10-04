import type { Metadata } from "next";
import { PresentacionClases } from "@/components/presentacion/presentacion-clases";

export const metadata: Metadata = {
  title: "Presentación de clases",
  description: "La presentación de bienvenida de las clases del Club de Monetización.",
};

/** Va fuera del grupo `(dashboard)` a propósito: sin barra lateral, para que la
 * presentación llene la pantalla. El acceso sigue protegido por `proxy.ts`. */
export default function PresentacionPage() {
  return <PresentacionClases />;
}
