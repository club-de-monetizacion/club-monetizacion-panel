import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RecogeElMenu } from "@/components/layout/recoge-el-menu";

export const dynamic = "force-dynamic";
export const metadata = { title: "YouTube Planner" };

/**
 * El YouTube Planner, dentro de la plataforma. Viene del panel del Máster tal cual
 * (`public/planner/planner.html`): lo único que cambió es a dónde guarda
 * (`/api/planner`, una copia para todo el equipo) y los colores.
 *
 * Va en un marco y no reescrito en React a propósito: son 5.300 líneas que llevan
 * tiempo funcionando. Ella misma se da cuenta de que está incrustada y se ajusta.
 */
export default async function YoutubePlannerPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="herramienta-a-sangre animate-fade-in">
      {/* El menú se recoge mientras se esté aquí: con él abierto la herramienta se
          queda estrecha y se pone en su modo de teléfono. */}
      <RecogeElMenu />
      {/* Se le da todo el alto que queda bajo la cabecera: la herramienta trae su
          propio menú y sus columnas, y con poco alto no se puede trabajar. */}
      <iframe
        /* Una clave fija: así React reutiliza este mismo marco en cada repintado en
           vez de crear uno nuevo, que recargaría la herramienta de cero. */
        key="planner-del-club"
        src="/planner/planner.html"
        title="YouTube Planner"
        /* La cabecera de la plataforma mide 64 px y deja una línea de borde: 65 px
           es lo que queda justo, sin desbordar por abajo. */
        className="h-[calc(100vh-65px)] min-h-[560px] w-full bg-[var(--azul-hondo)]"
      />
    </div>
  );
}
