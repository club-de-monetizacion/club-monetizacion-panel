"use client";

import Link from "next/link";
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
          collapsed && "md:w-0 md:min-w-0 md:overflow-hidden md:border-0 md:p-0 md:opacity-0"
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
        {PLATFORM_ORDER.map((platform) => {
          const info = PLATFORM_INFO[platform];
          const href = `/tableros/${platform.toLowerCase()}`;
          return (
            <NavLink key={platform} href={href} active={isActive(href)}>
              <span
                className="flex h-4 w-4 items-center justify-center rounded text-[11px]"
                style={{ background: `${info.color}22`, color: info.color }}
              >
                <PlatformIcon platform={platform} className="h-2.5 w-2.5" />
              </span>
              {info.label}
            </NavLink>
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

          {/* Las herramientas del Club son las mismas cuentas: de aquí se vuelve al
              panel sin tener que volver a entrar. */}
          <a
            href="https://panel.clubdemonetizacion.com"
            className="focus-ring flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-[var(--ink-2)] transition hover:bg-[var(--oro)]/10 hover:text-[var(--oro-claro)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 flex-none" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 12h13a5 5 0 0 1 5 5v2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Regresar al panel
          </a>
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
      /* Se adelanta la página al pasar el ratón por encima, así el clic ya no espera
         al servidor. Es lo que hace que la navegación se sienta inmediata. */
      prefetch
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
