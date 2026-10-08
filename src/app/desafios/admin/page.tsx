import Link from "next/link";
import { redirect } from "next/navigation";
import { EyeOff, FileSearch, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { filasDeLaTabla, ordenar, reclamosRecientes } from "@/lib/desafios-data";
import { abreviar, entero, fechaCorta, tituloLogro } from "@/lib/desafios";
import { Avatar } from "@/components/ui/avatar";
import { AdminLogro } from "@/components/desafios/admin-controles";
import { ChipDemo } from "@/components/desafios/chip-demo";
import { ChipNivel } from "@/components/desafios/chip-nivel";
import { RedIcon } from "@/components/desafios/red-icon";
import { VerPrueba } from "@/components/desafios/ver-prueba";

export const metadata = { title: "Moderación" };

/**
 * Para el equipo: todos los perfiles (también los ocultos) y las insignias de video
 * reclamadas hace poco, que son las que conviene mirar. Solo ADMIN.
 */
export default async function Moderacion() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/desafios");

  const [filas, reclamos] = await Promise.all([filasDeLaTabla(true, true), reclamosRecientes()]);
  const personas = ordenar(filas, "puntos");
  const sinPrueba = reclamos.filter((r) => !r.enlace && !r.captura).length;

  return (
    <div className="animate-fade-in space-y-8">
      <header>
        <p className="antetitulo">Moderación · solo el equipo</p>
        <h1 className="flex items-center gap-2 text-3xl font-bold"><ShieldCheck className="h-7 w-7 text-[var(--oro)]" /> Revisar Desafíos</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--ink-2)]">
          Aquí ves quién participa y lo último que se reclamó. Entra al perfil de alguien para quitarle
          una insignia, corregirle una cifra, ocultarlo de la tabla o dejarle una nota.
        </p>
      </header>

      <section>
        <h2 className="text-lg font-semibold">Reclamado en los últimos 14 días</h2>
        <p className="mb-3 text-xs text-[var(--ink-3)]">
          {reclamos.length} {reclamos.length === 1 ? "reclamo" : "reclamos"}, {sinPrueba} sin prueba. Los de seguidores se ganan solos y no aparecen aquí.
        </p>
        {reclamos.length === 0 ? (
          <p className="glass-panel rounded-2xl p-6 text-sm text-[var(--ink-3)]">Nada que revisar por ahora.</p>
        ) : (
          <ul className="space-y-2">
            {reclamos.map((r) => (
              <li key={r.id} className="fila-tabla flex flex-wrap items-center gap-x-4 gap-y-1 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    <Link href={`/desafios/creador/${r.perfil.id}`} className="hover:text-[var(--oro-claro)]">{r.perfil.nombre}</Link>
                    <span className="text-[var(--ink-3)]"> · {tituloLogro(r.tipo, r.umbral, r.red)}</span>
                  </p>
                  <p className="flex items-center gap-2 text-[11px] text-[var(--ink-3)]">
                    {fechaCorta(r.creadoEn.toISOString())}
                    {r.red && <RedIcon red={r.red} className="h-3 w-3" />}
                    {!r.enlace && !r.captura && <span className="text-amber-300">sin prueba</span>}
                    {r.estado === "REVOCADO" && <span className="text-red-300">quitada</span>}
                  </p>
                </div>
                <VerPrueba titulo={tituloLogro(r.tipo, r.umbral, r.red)} enlace={r.enlace} captura={r.captura} nota={r.nota} />
                <AdminLogro logroId={r.id} revocado={r.estado === "REVOCADO"} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Todas las personas ({personas.length})</h2>
        {personas.length === 0 ? (
          <p className="glass-panel rounded-2xl p-6 text-sm text-[var(--ink-3)]">Nadie se ha dado de alta todavía.</p>
        ) : (
          <ul className="space-y-2">
            {personas.map((f) => (
              <li key={f.id}>
                <Link href={`/desafios/creador/${f.id}`} className="fila-tabla flex items-center gap-3 p-3">
                  <Avatar src={f.foto} name={f.nombre} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate font-medium">
                      {f.nombre}
                      {f.esDemo && <ChipDemo />}
                      {f.oculto && <span className="chip inline-flex items-center gap-1"><EyeOff className="h-3 w-3" /> Oculto</span>}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-[var(--ink-3)]">
                      {f.redes.map((r) => (
                        <span key={r.red} className="inline-flex items-center gap-1"><RedIcon red={r.red} className="h-3 w-3" />{abreviar(r.seguidores)}</span>
                      ))}
                      {f.redes.length === 0 && "sin páginas"}
                    </div>
                  </div>
                  <ChipNivel numero={f.nivel.numero} nombre={f.nivel.nombre} />
                  <div className="w-20 text-right">
                    <p className="font-bold tabular-nums">{entero(f.puntos)}</p>
                    <p className="text-[10px] text-[var(--ink-3)]">{f.insignias} insignias</p>
                  </div>
                  <FileSearch className="h-4 w-4 text-[var(--ink-3)]" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
