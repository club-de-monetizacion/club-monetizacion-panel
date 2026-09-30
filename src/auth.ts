import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { entrarEquipo, papelDelRol, sigueValida } from "@/lib/panel-club";
import type { BackgroundType, Role } from "@prisma/client";

/**
 * Quién entra y con qué papel lo decide el panel del Club (ver `lib/panel-club.ts`).
 * Esta lista solo queda como salida de emergencia: si el panel estuviera caído y
 * hubiera que entrar, un correo de aquí se trata como ADMIN. Puede quedar vacía.
 */
const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Cada cuánto se le vuelve a preguntar al panel si la persona sigue teniendo acceso.
 * Preguntar en cada petición sería lo más seguro y lo más lento; cinco minutos es el
 * punto medio: «Quitar acceso» en el panel surte efecto casi al instante.
 */
const REVALIDAR_CADA_MS = 5 * 60 * 1000;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      accentColor: string;
      backgroundType: BackgroundType;
      backgroundColor: string;
      particlesEnabled: boolean;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    /** El token que devolvió el panel del Club, para revalidar la sesión. */
    panelTok?: string;
    /** Cuándo se revalidó por última vez contra el panel. */
    panelVisto?: number;
    role?: Role;
    accentColor?: string;
    backgroundType?: BackgroundType;
    backgroundColor?: string;
    particlesEnabled?: boolean;
  }
}

const nextAuth = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    /**
     * Se entra con la misma cuenta del panel del Club. `authorize` **no comprueba
     * ninguna contraseña**: se la pasa al panel y obedece su respuesta. Aquí no se
     * guarda, ni se copia, ni se cifra ninguna contraseña.
     */
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(datos) {
        const email = String(datos?.email ?? "").trim().toLowerCase();
        const clave = String(datos?.password ?? "");
        if (!email || !clave) return null;

        const entrada = await entrarEquipo(email, clave);
        if (!entrada.ok) return null;

        const papel = papelDelRol(entrada.rol) ?? (adminEmails.includes(email) ? "ADMIN" : null);
        if (!papel) return null;   // un papel que no conocemos no entra

        // El usuario se crea en el primer login y se identifica por el correo. La
        // base guarda sus tareas y preferencias, nunca su contraseña.
        const persona = await prisma.user.upsert({
          where: { email },
          update: { role: papel, ...(entrada.nombre ? { name: entrada.nombre } : {}) },
          create: { email, name: entrada.nombre ?? email, role: papel },
        });

        return {
          id: persona.id,
          email,
          name: persona.name,
          image: persona.image,
          panelTok: entrada.tok,
        };
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = request.nextUrl.pathname.startsWith("/login");
      if (isOnLogin) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", request.nextUrl));
        }
        return true;
      }
      return isLoggedIn;
    },
    async signIn({ user }) {
      // El papel ya lo asignó `authorize` con lo que dijo el panel del Club.
      return !!user.email;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.panelTok = (user as { panelTok?: string }).panelTok;
        token.panelVisto = Date.now();
      }
      if (!token.email) return token;

      // Se le pregunta al panel de tanto en tanto si la persona sigue dentro. Un
      // panel caído no echa a nadie: solo un «no» explícito (401/403) cierra la
      // sesión, para no dejar al equipo fuera por un fallo pasajero.
      if (token.panelTok && Date.now() - (token.panelVisto ?? 0) > REVALIDAR_CADA_MS) {
        const estado = await sigueValida(token.panelTok);
        token.panelVisto = Date.now();
        if (!estado.ok && estado.caducada) return null;
        if (estado.ok) {
          const papel = papelDelRol(estado.rol);
          if (!papel) return null;
          if (papel !== token.role) {
            // Un cambio de papel en el panel se refleja aquí sin volver a entrar.
            await prisma.user.updateMany({
              where: { email: token.email },
              data: { role: papel },
            });
            token.role = papel;
          }
        }
      }
      if (!token.id || trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.accentColor = dbUser.accentColor;
          token.backgroundType = dbUser.backgroundType;
          token.backgroundColor = dbUser.backgroundColor;
          token.particlesEnabled = dbUser.particlesEnabled;
          token.name = dbUser.name;
          token.picture = dbUser.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.role) session.user.role = token.role;
      session.user.accentColor = token.accentColor ?? "#8b5cf6";
      session.user.backgroundType = token.backgroundType ?? "PARTICLES";
      session.user.backgroundColor = token.backgroundColor ?? "#0b0f19";
      session.user.particlesEnabled = token.particlesEnabled ?? true;
      if (token.name) session.user.name = token.name;
      if (token.picture) session.user.image = token.picture;
      return session;
    },
  },
});

export const { signIn, signOut, auth } = nextAuth;
export const { GET, POST } = nextAuth.handlers;
