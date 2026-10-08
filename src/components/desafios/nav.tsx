"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ArrowLeft, Gamepad2, LogOut, Medal, ShieldCheck, Target, Trophy, UserRound, Wallet } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const ENLACES = [
  { href: "/desafios", texto: "Mi camino", Icono: Gamepad2, exacto: true },
  { href: "/desafios/retos", texto: "Retos", Icono: Target },
  { href: "/desafios/clasificacion", texto: "Clasificación", Icono: Trophy },
  { href: "/desafios/monetizacion", texto: "Monetización", Icono: Wallet },
  { href: "/desafios/paginas", texto: "Mis páginas", Icono: UserRound },
];

/** La barra de arriba de Desafíos: sus cuatro secciones y, para el equipo, la moderación. */
export function DesafiosNav({
  esEquipo,
  usuario,
}: {
  esEquipo: boolean;
  usuario: { nombre: string | null; foto: string | null; correo: string | null };
}) {
  const ruta = usePathname() ?? "";
  const activo = (href: string, exacto?: boolean) =>
    exacto ? ruta === href : ruta === href || ruta.startsWith(`${href}/`);
  const enlaces = esEquipo
    ? [...ENLACES, { href: "/desafios/admin", texto: "Moderación", Icono: ShieldCheck }]
    : ENLACES;

  return (
    <header className="glass-panel sticky top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <Link href="/desafios" className="flex items-center gap-2.5">
          <span className="cir-oro h-9 w-9">
            <Medal className="h-[18px] w-[18px]" />
          </span>
          <span className="hidden whitespace-nowrap lg:block">
            <span className="block font-[family-name:var(--font-titulos)] text-[15px] leading-tight font-semibold">Desafíos</span>
            <span className="antetitulo block !text-[9px]">Club de Monetización</span>
          </span>
        </Link>

        <nav className="ml-2 hidden flex-1 items-center gap-1 md:flex">
          {enlaces.map(({ href, texto, Icono, exacto }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "focus-ring inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition",
                activo(href, exacto)
                  ? "bg-[var(--oro)]/15 text-[var(--oro-claro)]"
                  : "text-[var(--ink-2)] hover:bg-white/5 hover:text-white",
              )}
            >
              <Icono className="h-4 w-4" /> {texto}
            </Link>
          ))}
        </nav>
        <div className="flex-1 md:hidden" />

        {esEquipo && (
          /* El `hidden` va en el envoltorio: `.btn-fantasma` fija su propio `display` y,
             al no estar en una capa de Tailwind, le gana a `hidden` si van juntos. */
          <span className="hidden xl:block">
            <Link href="/" className="btn-fantasma h-8 px-3 text-xs whitespace-nowrap">
              <ArrowLeft className="h-3.5 w-3.5" /> Panel del equipo
            </Link>
          </span>
        )}
        <span className="chip chip-oro hidden whitespace-nowrap md:inline">Borrador</span>
        <Avatar src={usuario.foto} name={usuario.nombre} email={usuario.correo} size={32} />
        <button
          onClick={() => signOut({ redirectTo: "/login" })}
          className="focus-ring rounded-md p-1.5 text-[var(--ink-3)] hover:bg-white/5 hover:text-white"
          aria-label="Salir"
          title="Salir"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* En el móvil la navegación va en una segunda fila con scroll */}
      <nav className="flex gap-1 overflow-x-auto border-t border-[var(--linea)] px-3 py-1.5 md:hidden">
        {enlaces.map(({ href, texto, Icono, exacto }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition",
              activo(href, exacto) ? "bg-[var(--oro)]/15 text-[var(--oro-claro)]" : "text-[var(--ink-2)]",
            )}
          >
            <Icono className="h-3.5 w-3.5" /> {texto}
          </Link>
        ))}
      </nav>
    </header>
  );
}
