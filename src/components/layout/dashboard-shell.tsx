"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { PLATFORM_INFO } from "@/lib/constants";
import type { Platform, Role } from "@prisma/client";

function titleFromPathname(pathname: string) {
  if (pathname === "/") return "Inicio";
  if (pathname.startsWith("/soporte")) return "Soporte";
  if (pathname.startsWith("/proyectos")) return "Proyectos";
  if (pathname.startsWith("/equipo")) return "Equipo";
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
  const pathname = usePathname();
  const title = titleFromPathname(pathname ?? "/");

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-h-screen w-full flex-1 flex-col">
        <Topbar title={title} onMenuClick={() => setOpen(true)} user={user} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
