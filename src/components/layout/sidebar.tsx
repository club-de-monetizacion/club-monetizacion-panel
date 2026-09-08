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
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_INFO, PLATFORM_ORDER } from "@/lib/constants";

export function Sidebar({
  open,
  onClose,
  collapsed,
}: {
  open: boolean;
  onClose: () => void;
  collapsed?: boolean;
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-violet-900/30">
              CM
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-[var(--ink-0)]">
                Club de Monetización
              </p>
              <p className="text-[11px] leading-tight text-[var(--ink-3)]">
                Panel del equipo
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
          href="/calendario"
          icon={<CalendarDays className="h-4 w-4" />}
          active={isActive("/calendario")}
        >
          Calendario
        </NavLink>
        <NavLink
          href="/ideas"
          icon={<Lightbulb className="h-4 w-4" />}
          active={isActive("/ideas")}
        >
          Ideas
        </NavLink>

        <p className="mb-1 mt-4 px-2.5 text-[11px] font-medium uppercase tracking-wide text-[var(--ink-3)]">
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
                {info.emoji}
              </span>
              {info.label}
            </NavLink>
          );
        })}

        <p className="mb-1 mt-4 px-2.5 text-[11px] font-medium uppercase tracking-wide text-[var(--ink-3)]">
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

        <div className="mt-auto pt-4">
          <NavLink
            href="/perfil"
            icon={<Settings className="h-4 w-4" />}
            active={isActive("/perfil")}
          >
            Mi perfil
          </NavLink>
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
      className={cn(
        "focus-ring flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition",
        active
          ? "bg-[var(--accent-soft)] text-[var(--ink-0)]"
          : "text-[var(--ink-2)] hover:bg-[var(--panel)] hover:text-[var(--ink-0)]"
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
