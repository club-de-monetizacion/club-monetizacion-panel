"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, LogOut, Settings, User, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Enlace as Link } from "@/components/ui/enlace";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PantallaCarga } from "@/components/layout/pantalla-carga";
import { ROLE_INFO } from "@/lib/constants";
import { initials } from "@/lib/utils";
import type { Role } from "@prisma/client";

/* El panel del Club: a donde lleva «Volver al panel» en todo el dominio. */
const PANEL_DEL_CLUB = "https://clubdemonetizacion.com";

export function Topbar({
  title,
  onMenuClick,
  collapsed,
  onToggleCollapsed,
  user,
}: {
  title: string;
  onMenuClick: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  user: { name?: string | null; email?: string | null; image?: string | null; role: Role };
}) {
  const salir = useRef<HTMLFormElement>(null);
  const [saliendo, setSaliendo] = useState(false);

  /* ⚠️ CERRAR SESIÓN ES CERRARLA EN TODO EL CLUB, Y SIN VER NADA EN MEDIO.
     Primero la pantalla de carga del Club, luego un POST normal a
     /api/salir-club, que borra las cookies del Club y las de aquí y manda a la
     portada del Club ya sin sesión. Nunca se abre el panel ni otra ventana. */
  const cerrarSesion = () => {
    setSaliendo(true);
    requestAnimationFrame(() => salir.current?.submit());
  };

  return (
    <header className="glass-panel sticky top-0 z-20 flex h-16 items-center justify-between gap-3 px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2 md:gap-3">
        {/* El mismo botón de todo el dominio, lo primero de la cabecera. */}
        <a href={PANEL_DEL_CLUB} className="club-volver" title="Volver al panel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span>Volver al panel</span>
        </a>
        <button
          onClick={onMenuClick}
          className="focus-ring shrink-0 rounded-md p-1.5 text-[var(--ink-2)] hover:bg-[var(--panel)] md:hidden"
          aria-label="Abrir el menú"
        >
          <Menu className="h-5 w-5" />
        </button>
        {onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            className="solo-escritorio focus-ring shrink-0 items-center rounded-md p-1.5 text-[var(--ink-2)] hover:bg-[var(--panel)] hover:text-[var(--ink-0)]"
            aria-label={collapsed ? "Mostrar barra lateral" : "Ocultar barra lateral"}
            title={collapsed ? "Mostrar barra lateral" : "Ocultar barra lateral"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-[18px] w-[18px]" />
            ) : (
              <PanelLeftClose className="h-[18px] w-[18px]" />
            )}
          </button>
        )}
        <h1 className="min-w-0 truncate text-base font-semibold text-[var(--ink-0)] md:text-lg">
          {title}
        </h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {/* Solo la foto y el punto verde, como en el resto del Club. */}
          <button className="cuenta-club" aria-label="Tu cuenta">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span className="ini">{initials(user.name, user.email)}</span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="truncate text-[var(--ink-0)]">{user.name}</p>
            <p className="truncate text-[10px] font-normal normal-case text-[var(--ink-3)]">
              {user.email}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="cursor-default data-[highlighted]:bg-transparent"
          >
            <User className="h-3.5 w-3.5" />
            {ROLE_INFO[user.role].label}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/perfil" className="flex items-center gap-2">
              <Settings className="h-3.5 w-3.5" />
              Configuración de perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={cerrarSesion} className="text-red-400">
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <form ref={salir} method="post" action="/api/salir-club" hidden />
      {/* Al <body>: dentro de la cabecera (sticky, z-20) el menú lateral le
          quedaba por encima. */}
      {saliendo && createPortal(<PantallaCarga />, document.body)}
    </header>
  );
}
