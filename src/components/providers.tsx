"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

/**
 * ⚠️ La sesión llega ya escrita desde el servidor. Sin ella, SessionProvider
 * pedía /api/auth/session nada más cargar y otra vez cada vez que volvías a la
 * pestaña: una petición más en cascada al abrir y una cada vuelta. Aquí solo
 * hace falta para `update()` en el perfil; lo demás lo lee el servidor.
 */
export function Providers({ session, children }: { session: Session | null; children: ReactNode }) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}
