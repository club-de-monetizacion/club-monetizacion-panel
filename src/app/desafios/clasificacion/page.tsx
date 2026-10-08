import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown, TrendingUp, Trophy, Users } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { filasDeLaTabla, ordenar, type FilaTabla, type Orden } from "@/lib/desafios-data";
import { abreviar, entero } from "@/lib/desafios";
import { Avatar } from "@/components/ui/avatar";
import { ChipDemo } from "@/components/desafios/chip-demo";
import { ChipNivel } from "@/components/desafios/chip-nivel";
import { Insignia } from "@/components/desafios/insignia";
import { RedIcon } from "@/components/desafios/red-icon";
import { cn } from "@/lib/utils";

export const metadata = { title: "Clasificación" };

const PESTANAS: { id: Orden; texto: string; Icono: typeof Trophy; unidad: string }[] = [
  { id: "puntos", texto: "Puntos", Icono: Trophy, unidad: "pts" },
  { id: "audiencia", texto: "Audiencia", Icono: Users, unidad: "seguidores" },
  { id: "crecimiento", texto: "Crecimiento", Icono: TrendingUp, unidad: "en 30 días" },
];

const valor = (f: FilaTabla, o: Orden) => {
  const n = f[o];
  if (n === null) return "—";
  return o === "crecimiento" ? `+${entero(n)}` : entero(n);
};

export default async function Clasificacion({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { t } = await searchParams;
  const orden: Orden = PESTANAS.some((p) => p.id === t) ? (t as Orden) : "puntos";
  const pestana = PESTANAS.find((p) => p.id === orden)!;

  const todas = await filasDeLaTabla();
  // Quien oculta sus seguidores sigue en «Puntos», pero no en las tablas que los usan.
  const usaSeguidores = orden !== "puntos";
  const ocultan = usaSeguidores ? todas.filter((f) => f.seguidoresOcultos).length : 0;
  const filas = ordenar(usaSeguidores ? todas.filter((f) => !f.seguidoresOcultos) : todas, orden);
  const podio = filas.slice(0, 3);
  const resto = filas.slice(3);
  // A mi perfil lo reconozco por su usuario; la tabla solo trae ids de perfil.
  const mio = await prisma.perfilCreador.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  return (
    <div className="animate-fade-in space-y-6">
      <header>
        <p className="antetitulo">Clasificación</p>
        <h1 className="text-3xl font-bold">Los creadores destacados del Club</h1>
        <p className="mt-1 text-sm text-[var(--ink-2)]">
          Entra a cualquier perfil para ver sus páginas, su avance y sus insignias.
        </p>
      </header>

      <nav className="flex gap-1 rounded-xl border border-[var(--linea)] bg-white/[0.03] p-1 sm:w-fit">
        {PESTANAS.map(({ id, texto, Icono }) => (
          <Link
            key={id}
            href={`/desafios/clasificacion?t=${id}`}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] transition sm:flex-none sm:px-4 sm:text-sm",
              orden === id ? "bg-[var(--oro)]/15 text-[var(--oro-claro)]" : "text-[var(--ink-2)] hover:text-white",
            )}
          >
            <Icono className="h-4 w-4" /> {texto}
          </Link>
        ))}
      </nav>

      {ocultan > 0 && (
        <p className="text-xs text-[var(--ink-3)]">
          {ocultan === 1 ? "1 creador prefiere" : `${ocultan} creadores prefieren`} mantener ocultos sus
          seguidores, así que no sale{ocultan === 1 ? "" : "n"} en esta tabla. Sí aparece{ocultan === 1 ? "" : "n"} en «Puntos».
        </p>
      )}

      {filas.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <p className="text-3xl">🏆</p>
          <p className="mt-2 font-semibold">La tabla está vacía</p>
          <p className="text-sm text-[var(--ink-3)]">Sé el primero en dar de alta tus páginas.</p>
        </div>
      ) : (
        <>
          {/* El podio */}
          <div className="grid gap-4 md:grid-cols-3">
            {podio.map((f, i) => (
              <Link
                key={f.id}
                href={`/desafios/creador/${f.id}`}
                className={cn(
                  "glass-panel group relative overflow-hidden rounded-2xl p-5 text-center transition hover:-translate-y-0.5",
                  // El primero va en el centro y más alto, como un podio
                  i === 0 && "md:order-2 md:-mt-3 border-[var(--oro)]/40",
                  i === 1 && "md:order-1",
                  i === 2 && "md:order-3",
                )}
              >
                <span className="absolute top-3 left-3 text-2xl" aria-label={`Puesto ${i + 1}`}>
                  {["🥇", "🥈", "🥉"][i]}
                </span>
                {i === 0 && <Crown className="absolute top-3 right-3 h-5 w-5 text-[var(--oro)]" />}
                <Avatar src={f.foto} name={f.nombre} size={i === 0 ? 84 : 68} className="mx-auto ring-2 ring-[var(--oro)]/40" />
                <p className="mt-3 truncate text-lg font-bold">{f.nombre}</p>
                <div className="mt-1 flex flex-wrap justify-center gap-1.5">
                  <ChipNivel numero={f.nivel.numero} nombre={f.nivel.nombre} />
                  {f.esDemo && <ChipDemo />}
                </div>
                <p className="mt-3 font-[family-name:var(--font-titulos)] text-3xl font-bold tabular-nums text-[var(--oro-claro)]">
                  {valor(f, orden)}
                </p>
                <p className="text-[11px] text-[var(--ink-3)]">{pestana.unidad}</p>
                <div className="mt-3 flex justify-center gap-1.5">
                  {f.destacadas.map((d) => (
                    <Insignia key={`${d.tipo}${d.red}${d.umbral}`} tipo={d.tipo} umbral={d.umbral} red={d.red} tamano={40} />
                  ))}
                </div>
              </Link>
            ))}
          </div>

          {/* El resto */}
          {resto.length > 0 && (
            <ol className="space-y-2">
              {resto.map((f, i) => (
                <li key={f.id}>
                  <Link
                    href={`/desafios/creador/${f.id}`}
                    className={cn("fila-tabla flex items-center gap-3 p-3 sm:gap-4", f.id === mio?.id && "es-mia")}
                  >
                    <span className="w-7 text-center font-[family-name:var(--font-titulos)] text-sm font-bold text-[var(--ink-3)]">
                      {i + 4}
                    </span>
                    <Avatar src={f.foto} name={f.nombre} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate font-medium">
                        {f.nombre}
                        {f.id === mio?.id && <span className="chip chip-oro">Tú</span>}
                        {f.esDemo && <ChipDemo />}
                      </p>
                      <p className="truncate text-xs text-[var(--ink-3)]">
                        Nivel {f.nivel.numero} · {f.nivel.nombre}{f.nicho ? ` · ${f.nicho}` : ""}
                      </p>
                    </div>
                    <div className="hidden items-center gap-2.5 md:flex">
                      {f.seguidoresOcultos && <span className="text-[11px] text-[var(--ink-3)]">seguidores ocultos</span>}
                      {f.redes.map((r) => (
                        <span key={r.red} className="flex items-center gap-1 text-xs text-[var(--ink-2)]">
                          <RedIcon red={r.red} className="h-3.5 w-3.5" /> {abreviar(r.seguidores)}
                        </span>
                      ))}
                    </div>
                    <div className="hidden gap-1 lg:flex">
                      {f.destacadas.map((d) => (
                        <Insignia key={`${d.tipo}${d.red}${d.umbral}`} tipo={d.tipo} umbral={d.umbral} red={d.red} tamano={32} />
                      ))}
                    </div>
                    <div className="w-24 text-right">
                      <p className="font-[family-name:var(--font-titulos)] text-lg font-bold tabular-nums">{valor(f, orden)}</p>
                      <p className="text-[10px] text-[var(--ink-3)]">{pestana.unidad}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
