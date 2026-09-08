"use client";

import { signOut } from "next-auth/react";
import { Menu, LogOut, Settings, User, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_INFO } from "@/lib/constants";
import type { Role } from "@prisma/client";

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
  return (
    <header className="glass-panel sticky top-0 z-20 flex h-16 items-center justify-between gap-3 px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={onMenuClick}
          className="focus-ring rounded-md p-1.5 text-[var(--ink-2)] hover:bg-[var(--panel)] md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        {onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            className="focus-ring hidden rounded-md p-1.5 text-[var(--ink-2)] hover:bg-[var(--panel)] hover:text-[var(--ink-0)] md:flex"
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
        <h1 className="text-base font-semibold text-[var(--ink-0)] md:text-lg">
          {title}
        </h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="focus-ring flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-[var(--panel)]">
            <Avatar src={user.image} name={user.name} email={user.email} size={32} />
            <span className="hidden text-sm font-medium text-[var(--ink-1)] sm:inline">
              {user.name?.split(" ")[0]}
            </span>
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
          <DropdownMenuItem
            onSelect={() => signOut({ redirectTo: "/login" })}
            className="text-red-400"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
