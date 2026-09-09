"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { PLATFORM_INFO } from "@/lib/constants";
import type { Platform, Role } from "@prisma/client";

const SIDEBAR_COLLAPSED_KEY = "ccm-sidebar-collapsed";

function titleFromPathname(pathname: string) {
  if (pathname === "/") return "Inicio";
  if (pathname.startsWith("/calendario")) return "Calendario";
  if (pathname.startsWith("/ideas")) return "Ideas";
  if (pathname.startsWith("/tareas-personales")) return "Tareas personales";
  if (pathname.startsWith("/soporte")) return "Soporte";
  if (pathname.startsWith("/proyectos")) return "Proyectos";
  if (pathname.startsWith("/equipo")) return "Equipo";
  if (pathname.startsWith("/tareas-diarias-soporte")) return "Tareas diarias Soporte";
  if (pathname.startsWith("/perfil")) return "Mi perfil";
  if (pathname.startsWith("/tableros/")) {
    const slug = pathname.split("/")[2]?.toUpperCase() as Platform | undefined;
    if (slug && PLATFORM_INFO[slug]) return `Tablero — ${PLATFORM_INFO[slug].label}`;
    return "Tableros";
  }
  return "Panel";
}

export function DashboardShell({
  user,
  children,
}: {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: Role;
  };
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // Starts expanded on every render (server included) and only reads the
  // saved preference after mount, so hydration never has to reconcile a
  // client-only value against the server's markup.
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const title = titleFromPathname(pathname ?? "/");

  useEffect(() => {
    // Client-only read of the viewer's saved preference; deferred to an
    // effect (rather than a useState initializer) so server and client
    // render the same markup on hydration and only diverge afterwards.
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(saved);
    } catch {
      // localStorage unavailable (private mode, etc.) — keep it expanded.
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // Ignore — the preference just won't persist this session.
      }
      return next;
    });
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar
        open={open}
        onClose={() => setOpen(false)}
        collapsed={collapsed}
        role={user.role}
      />
      <div className="flex min-h-screen w-full flex-1 flex-col">
        <Topbar
          title={title}
          onMenuClick={() => setOpen(true)}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          user={user}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
