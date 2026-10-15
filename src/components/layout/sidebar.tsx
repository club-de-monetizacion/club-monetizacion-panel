"use client";

import { Enlace as Link } from "@/components/ui/enlace";
import { usePathname } from "next/navigation";
import {
  Home,
  LifeBuoy,
  FolderKanban,
  Users,
  Settings,
  CalendarDays,
  Lightbulb,
  ClipboardCheck,
  ClipboardList,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_INFO, PLATFORM_ORDER } from "@/lib/constants";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { AppLogo } from "@/components/layout/app-logo";
import type { Role } from "@prisma/client";
import { useEffect, useState } from "react";

/* El orden de las herramientas de Contenido lo decide cada quien arrastrando.
   Se guarda en este dispositivo: es una preferencia de vista, no un dato del
   equipo. YouTube no está: su sitio lo ocupa el Planner. */
const LLAVE_ORDEN = "sidebar_orden_contenido";
const PLANNER = "__planner__";

export function Sidebar({
  open,
  onClose,
  collapsed,
  role,
}: {
  open: boolean;
  onClose: () => void;
  collapsed?: boolean;
  role?: Role;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  /* Contenido: las plataformas (menos YouTube) y el Planner, en una sola
     lista que se puede reordenar arrastrando. */
  const porDefecto = [
    ...PLATFORM_ORDER.filter((p) => p !== "YOUTUBE"),
    PLANNER,
  ] as string[];
  const [orden, setOrden] = useState<string[]>(porDefecto);
  const [arrastrando, setArrastrando] = useState<string | null>(null);

  useEffect(() => {
    try {
      const g = JSON.parse(localStorage.getItem(LLAVE_ORDEN) || "null");
      if (Array.isArray(g)) {
        /* se respeta lo guardado, pero sin perder lo que haya aparecido
           después ni arrastrar lo que ya no existe */
        const vivos = g.filter((x: string) => porDefecto.includes(x));
        const nuevos = porDefecto.filter((x) => !vivos.includes(x));
        // Lo guardado en este dispositivo solo se puede leer ya montado: el
        // servidor no lo conoce (mismo patrón que dashboard-shell.tsx).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOrden([...vivos, ...nuevos]);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guardaOrden = (lista: string[]) => {
    setOrden(lista);
    try { localStorage.setItem(LLAVE_ORDEN, JSON.stringify(lista)); } catch {}
  };

  const alSoltar = (destino: string) => {
    if (!arrastrando || arrastrando === destino) return;
    const lista = orden.filter((x) => x !== arrastrando);
    const i = lista.indexOf(destino);
    lista.splice(i < 0 ? lista.length : i, 0, arrastrando);
    guardaOrden(lista);
    setArrastrando(null);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "glass-panel-strong fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col gap-1 overflow-y-auto p-4 transition-all duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          /* `menu-recogido` está en globals.css: las variantes md: de Tailwind no
             llegaban al CSS compilado y el botón no hacía nada. */
          collapsed && "menu-recogido"
        )}
      >
        <div className="mb-4 flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <AppLogo className="h-9 w-9 shrink-0 text-sm" />
            <div>
              <p className="font-[family-name:var(--font-titulos)] text-[15px] leading-tight font-semibold text-[var(--ink-0)]">
                Club de Monetización
              </p>
              <p className="text-[10px] leading-tight font-medium tracking-[0.18em] text-[var(--oro)] uppercase">
                Tareas del equipo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="focus-ring rounded-md p-1 text-[var(--ink-3)] hover:bg-[var(--panel)] md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <NavLink href="/" icon={<Home className="h-4 w-4" />} active={isActive("/")}>
          Inicio
        </NavLink>
        <NavLink
          href="/pendientes"
          icon={<ClipboardList className="h-4 w-4" />}
          active={isActive("/pendientes")}
        >
          Pendientes
        </NavLink>
        <NavLink
          href="/ideas"
          icon={<Lightbulb className="h-4 w-4" />}
          active={isActive("/ideas")}
        >
          Ideas
        </NavLink>
        <NavLink
          href="/calendario"
          icon={<CalendarDays className="h-4 w-4" />}
          active={isActive("/calendario")}
        >
          Calendario
        </NavLink>

        <p className="px-[13px] pt-4 pb-1.5 text-[10px] font-semibold tracking-[0.24em] text-[var(--ink-3)]/70 uppercase">
          Contenido
        </p>
        {orden.map((clave) => {
          const esPlanner = clave === PLANNER;
          const info = esPlanner ? null : PLATFORM_INFO[clave as keyof typeof PLATFORM_INFO];
          const href = esPlanner ? "/youtube-planner" : `/tableros/${clave.toLowerCase()}`;
          return (
            <div
              key={clave}
              draggable
              onDragStart={() => setArrastrando(clave)}
              onDragEnd={() => setArrastrando(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => alSoltar(clave)}
              className={cn(
                "cursor-grab active:cursor-grabbing",
                arrastrando === clave && "opacity-40",
                arrastrando && arrastrando !== clave && "border-t border-dashed border-[var(--oro)]/40",
              )}
            >
              <NavLink href={href} active={isActive(href)}>
                <span
                  className="flex h-4 w-4 items-center justify-center rounded text-[11px]"
                  style={
                    esPlanner
                      ? { background: "#ff000022", color: "#ff4444" }
                      : { background: `${info!.color}22`, color: info!.color }
                  }
                >
                  {esPlanner ? (
                    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor">
                      <path d="M10 15.5l6-3.5-6-3.5v7z" />
                      <path
                        d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8C22 15.2 22 12 22 12s0-3.2-.4-4.8z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                    </svg>
                  ) : (
                    <PlatformIcon platform={clave as never} className="h-2.5 w-2.5" />
                  )}
                </span>
                {esPlanner ? "YouTube Planner" : info!.label}
              </NavLink>
            </div>
          );
        })}

        <p className="px-[13px] pt-4 pb-1.5 text-[10px] font-semibold tracking-[0.24em] text-[var(--ink-3)]/70 uppercase">
          Equipo
        </p>
        <NavLink
          href="/soporte"
          icon={<LifeBuoy className="h-4 w-4" />}
          active={isActive("/soporte")}
        >
          Soporte
        </NavLink>
        <NavLink
          href="/proyectos"
          icon={<FolderKanban className="h-4 w-4" />}
          active={isActive("/proyectos")}
        >
          Proyectos
        </NavLink>
        <NavLink
          href="/equipo"
          icon={<Users className="h-4 w-4" />}
          active={isActive("/equipo")}
        >
          Equipo
        </NavLink>
        {role === "ADMIN" && (
          <NavLink
            href="/tareas-diarias-soporte"
            icon={<ClipboardCheck className="h-4 w-4" />}
            active={isActive("/tareas-diarias-soporte")}
          >
            Tareas diarias Soporte
          </NavLink>
        )}

        <div className="mt-auto space-y-1 pt-4">
          <NavLink
            href="/perfil"
            icon={<Settings className="h-4 w-4" />}
            active={isActive("/perfil")}
          >
            Mi perfil
          </NavLink>

          {/* «Volver al Club» ya no va aquí: el botón de volver es uno solo en
              todo el dominio, «Volver al panel», arriba a la izquierda de la
              cabecera (ver topbar.tsx). Dos botones distintos para lo mismo era
              justo lo que había que quitar. */}
        </div>
      </aside>
    </>
  );
}

function NavLink({
  href,
  icon,
  active,
  children,
}: {
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      /* ⚠️ Es `Enlace` (components/ui/enlace.tsx), no el `Link` de Next: la
         página se adelanta solo al acercar el ratón o el dedo. Con el
         automático los 14 enlaces del menú volvían a pedirse al servidor tras
         cada refresco vivo (cada 15 s por pestaña abierta). */
      className={cn(
        "focus-ring flex items-center gap-[11px] rounded-xl border border-transparent px-[13px] py-[11px] text-sm font-medium transition-[color,background,border-color] duration-150",
        active
          ? "border-[var(--linea)] bg-[var(--oro)]/[0.08] text-[var(--oro-claro)]"
          : "text-[var(--ink-2)] hover:bg-white/[0.045] hover:text-[var(--ink-0)]"
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
