import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { perfilDe } from "@/lib/desafios-data";
import { MiCaminoVista } from "@/components/desafios/vistas/mi-camino";
import { PerfilForm } from "@/components/desafios/perfil-form";

export default async function MiCamino() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perfil = await perfilDe(session.user.id, false);

  /* Sin perfil: lo primero es presentarse. */
  if (!perfil) {
    return (
      <div className="mx-auto max-w-xl animate-fade-in">
        <div className="mb-6 text-center">
          <span className="cir-oro mx-auto h-14 w-14">
            <Sparkles className="h-6 w-6" />
          </span>
          <p className="antetitulo mt-4">Desafíos del Club</p>
          <h1 className="mt-1 text-3xl font-bold">Tu camino como creador empieza aquí</h1>
          <p className="mt-2 text-sm text-[var(--ink-2)]">
            Da de alta tus páginas, anota cómo crecen y gana insignias en cada escalón: de tus
            primeros 100 seguidores a los millones. Compite con otros creadores del Club.
          </p>
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <PerfilForm
            existe={false}
            inicial={{
              nombre: session.user.name ?? "",
              bio: "",
              nicho: "",
              foto: null,
              visible: true,
              mostrarSeguidores: true,
              mostrarIngresos: false,
            }}
          />
        </div>
      </div>
    );
  }

  return <MiCaminoVista perfil={perfil} />;
}
