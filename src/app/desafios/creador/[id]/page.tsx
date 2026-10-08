import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BadgeCheck, ExternalLink, EyeOff, Flame, Lock, Wallet } from "lucide-react";
import { auth } from "@/auth";
import { perfilVistoPor, type CuentaVista, type LogroVista } from "@/lib/desafios-data";
import { RED_INFO, dolaresExactos, entero, fechaCorta, nombreDeMes, nombreNivel, puntosDe, tituloLogro } from "@/lib/desafios";
import { Avatar } from "@/components/ui/avatar";
import { AdminCuenta, AdminIngreso, AdminLogro, AdminPerfil } from "@/components/desafios/admin-controles";
import { Barra } from "@/components/desafios/barra";
import { ChipDemo } from "@/components/desafios/chip-demo";
import { ChipNivel } from "@/components/desafios/chip-nivel";
import { Insignia } from "@/components/desafios/insignia";
import { RedIcon } from "@/components/desafios/red-icon";
import { Sparkline } from "@/components/desafios/sparkline";
import { VerPrueba } from "@/components/desafios/ver-prueba";

export const metadata = { title: "Perfil de creador" };

export default async function PerfilPublico({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  const esEquipo = session.user.role === "ADMIN";
  // El servidor entrega el perfil ya sin lo que su dueña decidió ocultar a quien mira.
  const perfil = await perfilVistoPor(id, { userId: session.user.id, esEquipo });
  if (!perfil) notFound();

  const esMio = perfil.userId === session.user.id;
  const oculto = !perfil.visible || perfil.ocultoPorEquipo;
  // Un perfil que su dueño o el equipo sacaron de la tabla solo lo ven ellos.
  if (oculto && !esMio && !esEquipo) notFound();

  const ganadas = perfil.logros.filter((l) => l.estado === "ACTIVO");
  // Quien no es el dueño ni el equipo no ve las insignias que se revocaron.
  const quitadas = perfil.logros.filter((l) => l.estado === "REVOCADO");
  const verQuitadas = esMio || esEquipo;
  const { nivel } = perfil;
  // Quien lo ve todo (la dueña o el equipo) debe saber qué es privado para los demás.
  const privados = [
    !perfil.mostrarSeguidores && "sus cifras de seguidores",
    !perfil.mostrarIngresos && "sus ingresos",
  ].filter(Boolean) as string[];

  return (
    <div className="animate-fade-in space-y-6">
      {perfil.esDemo && (
        <p className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm text-sky-200">
          <strong>Perfil de demostración.</strong> No es una persona real: sus páginas y cifras son inventadas
          para enseñar cómo se ve Desafíos con datos. Se borra antes de publicar.
        </p>
      )}
      {oculto && (
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-200">
          {perfil.ocultoPorEquipo
            ? "El equipo sacó este perfil de la tabla. Solo lo ve el equipo y su dueño."
            : "Este perfil no sale en la tabla: su dueño lo ocultó."}
        </p>
      )}

      {(esMio || esEquipo) && privados.length > 0 && (
        <p className="flex items-center gap-2 rounded-xl border border-[var(--linea)] bg-white/[0.04] px-4 py-2 text-sm text-[var(--ink-2)]">
          <EyeOff className="h-4 w-4 shrink-0" />
          {esMio ? "Tú decides: " : "Esta persona decidió mantener privados "}
          {esMio ? `los demás no ven ${privados.join(" ni ")}.` : `${privados.join(" ni ")}. Tú los ves por ser del equipo.`}
        </p>
      )}

      <section className="glass-panel relative overflow-hidden rounded-3xl p-5 md:p-7">
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[var(--azul-vivo)]/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar src={perfil.foto} name={perfil.nombre} size={96} className="ring-2 ring-[var(--oro)]/50" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold">{perfil.nombre}</h1>
              <ChipNivel numero={nivel.numero} nombre={nivel.nombre} />
              {perfil.esDemo && <ChipDemo />}
              {esMio && <span className="chip chip-oro">Eres tú</span>}
            </div>
            {perfil.nicho && <p className="mt-0.5 text-sm text-[var(--oro-claro)]">{perfil.nicho}</p>}
            {perfil.bio && <p className="mt-2 max-w-xl text-sm text-[var(--ink-1)]">{perfil.bio}</p>}
            <div className="mt-3 max-w-sm">
              <Barra valor={nivel.avance} alto={6} />
              <p className="mt-1 text-[11px] text-[var(--ink-3)]">
                {entero(perfil.puntos)} puntos · siguiente: {nombreNivel(nivel.numero + 1)}
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-3 text-center sm:w-64">
            <Dato valor={entero(ganadas.length)} etiqueta="Insignias" />
            <Dato valor={perfil.seguidoresOcultos ? "Oculta" : entero(perfil.audiencia)} etiqueta="Audiencia" />
            <Dato valor={String(perfil.cuentas.length)} etiqueta="Páginas" />
          </dl>
        </div>
        <p className="relative mt-4 text-[11px] text-[var(--ink-3)]">En el Club desde {fechaCorta(perfil.creadoEn)}</p>
      </section>

      {esEquipo && (
        <section className="rounded-2xl border border-[var(--oro)]/30 bg-[var(--oro)]/[0.05] p-4">
          <p className="antetitulo mb-3">Moderación · solo el equipo</p>
          <AdminPerfil perfilId={perfil.id} oculto={perfil.ocultoPorEquipo} nota={perfil.notaEquipo} />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Sus páginas</h2>
        {perfil.cuentas.length === 0 ? (
          <p className="glass-panel rounded-2xl p-6 text-sm text-[var(--ink-3)]">Aún no ha dado de alta ninguna página.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {perfil.cuentas.map((c) => (
              <TarjetaPublica key={c.id} c={c} esEquipo={esEquipo} ocultos={perfil.seguidoresOcultos} />
            ))}
          </div>
        )}
      </section>

      {/* Ingresos: se enseñan solo si su dueña quiere (o a ella y al equipo) */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Wallet className="h-5 w-5 text-[var(--oro)]" /> Ingresos
        </h2>
        {perfil.ingresosOcultos ? (
          <p className="glass-panel flex items-center gap-2 rounded-2xl p-5 text-sm text-[var(--ink-3)]">
            <Lock className="h-4 w-4" /> {perfil.nombre.split(/\s+/)[0]} mantiene sus ingresos privados.
          </p>
        ) : perfil.ingresos.length === 0 ? (
          <p className="glass-panel rounded-2xl p-5 text-sm text-[var(--ink-3)]">Todavía no ha anotado ingresos.</p>
        ) : (
          <div className="glass-panel rounded-2xl p-5">
            <p className="font-[family-name:var(--font-titulos)] text-3xl font-bold tabular-nums">{dolaresExactos(perfil.ingresosUsd)}</p>
            <p className="mb-3 text-xs text-[var(--ink-3)]">ganados en total, en dólares</p>
            <ul className="divide-y divide-[var(--linea)]">
              {perfil.ingresos.slice(0, 8).map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-2 text-sm">
                  <RedIcon red={i.red} className="h-4 w-4" />
                  <span className="flex-1 capitalize">{nombreDeMes(i.mes)}{i.nota ? <span className="text-xs normal-case text-[var(--ink-3)]"> · {i.nota}</span> : null}</span>
                  {i.captura && <VerPrueba titulo={`${nombreDeMes(i.mes)} · ${RED_INFO[i.red].nombre}`} enlace={null} captura={i.captura} nota={null} />}
                  <span className="font-medium tabular-nums">{dolaresExactos(i.monto)}</span>
                  {esEquipo && <AdminIngreso ingresoId={i.id} />}
                </li>
              ))}
            </ul>
            {perfil.ingresos.length > 8 && <p className="mt-2 text-xs text-[var(--ink-3)]">y {perfil.ingresos.length - 8} meses más</p>}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Flame className="h-5 w-5 text-[var(--oro)]" /> Insignias ({ganadas.length})
        </h2>
        {ganadas.length === 0 ? (
          <p className="glass-panel rounded-2xl p-6 text-sm text-[var(--ink-3)]">Todavía no hay insignias. ¡Todo gran creador empezó en cero!</p>
        ) : (
          <div className="glass-panel grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-x-3 gap-y-6 rounded-2xl p-5">
            {ganadas
              .sort((a, b) => puntosDe(b.tipo, b.umbral) - puntosDe(a.tipo, a.umbral))
              .map((l) => <CeldaLogro key={l.id} l={l} esEquipo={esEquipo} />)}
          </div>
        )}
      </section>

      {verQuitadas && quitadas.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-red-300">Insignias revisadas por el equipo ({quitadas.length})</h2>
          <div className="glass-panel grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-x-3 gap-y-6 rounded-2xl p-5">
            {quitadas.map((l) => <CeldaLogro key={l.id} l={l} esEquipo={esEquipo} />)}
          </div>
        </section>
      )}

      {esMio && (
        <p className="text-center text-xs text-[var(--ink-3)]">
          <Link href="/desafios/paginas" className="text-[var(--oro-claro)] hover:underline">Editar mi perfil y mis páginas</Link>
        </p>
      )}
    </div>
  );
}

function Dato({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-2 py-3">
      <dd className="font-[family-name:var(--font-titulos)] text-lg leading-none font-bold tabular-nums">{valor}</dd>
      <dt className="mt-1 text-[10px] tracking-wider text-[var(--ink-3)] uppercase">{etiqueta}</dt>
    </div>
  );
}

function TarjetaPublica({ c, esEquipo, ocultos }: { c: CuentaVista; esEquipo: boolean; ocultos: boolean }) {
  const h = c.historial;
  const delta = h.length >= 2 ? c.seguidores - h[0].seguidores : 0;
  return (
    <article className="glass-panel rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar src={c.foto} name={c.nombre} size={46} />
          <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0b1428] ring-1 ring-[var(--linea)]">
            <RedIcon red={c.red} className="h-3 w-3" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{c.nombre}</p>
          <a href={c.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-xs text-[var(--ink-3)] hover:text-[var(--oro-claro)]">
            {RED_INFO[c.red].nombre} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="text-right">
          {ocultos ? (
            <p className="flex items-center gap-1 text-xs text-[var(--ink-3)]"><Lock className="h-3 w-3" /> Seguidores ocultos</p>
          ) : (
            <>
              <p className="font-[family-name:var(--font-titulos)] text-2xl leading-none font-bold tabular-nums">{entero(c.seguidores)}</p>
              {delta > 0 && <p className="text-[11px] font-medium text-emerald-400">+{entero(delta)} desde que empezó</p>}
            </>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        {!ocultos && <Sparkline puntos={h} className="h-10 w-full max-w-48" />}
        {c.leidoDeLaRed && (
          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-emerald-400">
            <BadgeCheck className="h-3.5 w-3.5" /> Leído de YouTube
          </span>
        )}
      </div>
      {esEquipo && (
        <div className="mt-3 border-t border-[var(--linea)] pt-2">
          <AdminCuenta cuentaId={c.id} seguidores={c.seguidores} />
        </div>
      )}
    </article>
  );
}

function CeldaLogro({ l, esEquipo }: { l: LogroVista; esEquipo: boolean }) {
  const revocado = l.estado === "REVOCADO";
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <Insignia tipo={l.tipo} umbral={l.umbral} red={l.red} estado={revocado ? "revocada" : "ganada"} tamano={72} />
      <p className="text-[11px] leading-tight text-[var(--ink-1)]">{tituloLogro(l.tipo, l.umbral, l.red)}</p>
      <p className="text-[10px] text-[var(--ink-3)]">{fechaCorta(l.creadoEn)}</p>
      {!revocado && (l.enlace || l.captura || l.nota) && (
        <VerPrueba titulo={tituloLogro(l.tipo, l.umbral, l.red)} enlace={l.enlace} captura={l.captura} nota={l.nota} />
      )}
      {!revocado && !l.enlace && !l.tieneCaptura && (l.tipo === "VISTAS" || l.tipo === "LIKES") && !l.origenClave && (
        <p className="text-[10px] text-[var(--ink-3)]">Sin prueba</p>
      )}
      {revocado && l.motivoRevocacion && esEquipo && (
        <p className="text-[10px] text-red-300">{l.motivoRevocacion}{l.revocadoPor ? ` · ${l.revocadoPor}` : ""}</p>
      )}
      {esEquipo && <AdminLogro logroId={l.id} revocado={revocado} />}
    </div>
  );
}
