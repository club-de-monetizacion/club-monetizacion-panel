import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { perfilDe } from "@/lib/desafios-data";
import { youtubeDisponible } from "@/lib/youtube";
import { PaginasManager } from "@/components/desafios/paginas-manager";
import { PerfilForm } from "@/components/desafios/perfil-form";

export const metadata = { title: "Mis páginas" };

export default async function MisPaginas() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const perfil = await perfilDe(session.user.id);
  if (!perfil) redirect("/desafios");

  return (
    <div className="animate-fade-in space-y-8">
      <header>
        <p className="antetitulo">Mis páginas</p>
        <h1 className="text-3xl font-bold">Tus redes y tu perfil</h1>
        <p className="mt-1 max-w-xl text-sm text-[var(--ink-2)]">
          Anota cuántos seguidores tienes cada vez que quieras: cada avance queda guardado y cuenta
          para tus insignias.
          {youtubeDisponible()
            ? " Los canales de YouTube se pueden leer solos."
            : " Por ahora las cifras se anotan a mano."}
        </p>
      </header>

      <PaginasManager cuentas={perfil.cuentas} youtubeAuto={youtubeDisponible()} />

      <section>
        <h2 className="mb-3 text-lg font-semibold">Mi perfil de creador</h2>
        <div className="glass-panel rounded-2xl p-5">
          <PerfilForm
            existe
            inicial={{
              nombre: perfil.nombre,
              bio: perfil.bio ?? "",
              nicho: perfil.nicho ?? "",
              foto: perfil.foto,
              visible: perfil.visible,
              mostrarSeguidores: perfil.mostrarSeguidores,
              mostrarIngresos: perfil.mostrarIngresos,
            }}
          />
        </div>
      </section>
    </div>
  );
}
