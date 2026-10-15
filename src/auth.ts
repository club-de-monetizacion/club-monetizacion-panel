import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import {
  GALLETA,
  aEntrarEnElClub,
  huellaDe,
  origenPublico,
  papelEnTareas,
  preguntaAlClub,
} from "@/lib/club-sso";
import type { BackgroundType, Role } from "@prisma/client";

/**
 * Cada cuánto se le vuelve a preguntar al Club si la persona sigue siendo del equipo.
 *
 * Esa pregunta va dentro de una navegación, así que se paga en la pantalla: con un
 * cuarto de hora se paga poco y «quitar acceso» en el Club surte efecto pronto. Si
 * el Club no contesta en 2 s no se echa a nadie (ver `lib/club-sso.ts`).
 */
const REVALIDAR_CADA_MS = 15 * 60 * 1000;

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
    /** De qué cookie del Club salió esta sesión: un resumen, nunca la cookie. */
    huella?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    /** La cookie del Club con la que se entró, para volver a preguntarle al Club. */
    clubTok?: string;
    /** Su resumen: si la cookie del navegador cambia, la sesión de aquí ya no vale. */
    huella?: string;
    /** Cuándo se le preguntó al Club por última vez. */
    clubVisto?: number;
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
    error: "/login",
  },
  providers: [
    /**
     * LA MISMA SESIÓN DEL CLUB, Y NINGUNA OTRA.
     *
     * No pide nada: recibe la cookie del Club que ya trae el navegador y le pregunta
     * al Club de quién es. Solo el equipo entra. Aquí no hay formulario de correo y
     * contraseña ni clave maestra: entrar y salir es el mismo protocolo que en el
     * resto del Club (Diego: «ES UNA MISMA HERRAMIENTA»).
     */
    Credentials({
      id: "club",
      name: "Club de Monetización",
      credentials: { galleta: { type: "text" } },
      async authorize(datos) {
        const valor = String(datos?.galleta ?? "");
        const r = await preguntaAlClub(valor);
        if (r.estado !== "dentro") return null;
        const papel = papelEnTareas(r.quien.rol);
        if (!papel) return null; // un alumno no entra a los tableros internos

        const { email, nombre, foto } = r.quien;
        // La persona se identifica por su correo. La foto del Club solo se usa si
        // aquí no tiene una propia: la que alguien subió en su perfil manda.
        const previa = await prisma.user.findUnique({
          where: { email },
          select: { image: true },
        });
        const persona = previa
          ? await prisma.user.update({
              where: { email },
              data: {
                role: papel,
                ...(nombre ? { name: nombre } : {}),
                ...(!previa.image && foto ? { image: foto } : {}),
              },
            })
          : await prisma.user.create({
              data: { email, name: nombre || email, role: papel, image: foto || null },
            });

        return {
          id: persona.id,
          email,
          name: persona.name,
          image: persona.image,
          clubTok: valor,
          huella: await huellaDe(valor),
        };
      },
    }),
  ],
  callbacks: {
    /**
     * EL PORTERO DE CADA PÁGINA (lo ejecuta `proxy.ts`).
     *
     * ⚠️ Sin la cookie del Club no hay sesión aquí, aunque quede la de Auth.js: si
     * se cerró sesión en el Club (o en cualquier herramienta), aquí también. Y si la
     * cookie del Club cambió (entró otra persona), se vuelve a entrar con la nueva.
     * Nada de esto pregunta al Club: es mirar una cookie, sale gratis.
     */
    async authorized({ auth, request }) {
      const aqui = request.nextUrl;
      const ruta = aqui.pathname;

      /* La app de escritorio no tiene sesión de navegador: se identifica con su
         llave en la cabecera y la comprueba la propia ruta. (Las /api/ ya quedan
         fuera del `matcher`; esto es por si algún día se amplía.) */
      if (ruta.startsWith("/api/")) return true;

      const enLaPuerta = ruta.startsWith("/login");
      const valor = request.cookies.get(GALLETA)?.value ?? "";

      // Sin sesión del Club: al acceso del Club, que al entrar te devuelve aquí.
      if (!valor) {
        const origen = origenPublico(request.headers, aqui);
        return Response.redirect(
          aEntrarEnElClub(origen + (enLaPuerta ? "/" : ruta + aqui.search)),
        );
      }

      // La pantalla de carga que vuelve a probar cuando el Club no contestó.
      if (enLaPuerta && aqui.searchParams.has("reintento")) return true;

      const misma = !!auth?.user && auth.huella === (await huellaDe(valor));
      if (!misma) {
        const volver = enLaPuerta ? "/" : ruta + aqui.search;
        return Response.redirect(
          new URL("/api/entrar-club?volver=" + encodeURIComponent(volver), aqui),
        );
      }
      if (enLaPuerta) return Response.redirect(new URL("/", aqui));
      return true;
    },
    async signIn({ user }) {
      // El papel ya lo asignó `authorize` con lo que dijo el Club.
      return !!user.email;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        const delClub = user as { clubTok?: string; huella?: string };
        token.clubTok = delClub.clubTok;
        token.huella = delClub.huella;
        token.clubVisto = Date.now();
      }
      if (!token.email) return token;

      /* Se le pregunta al Club de tanto en tanto si la persona sigue siendo del
         equipo. Un Club caído no echa a nadie: solo un «no» explícito cierra la
         sesión, para no dejar al equipo fuera por un fallo pasajero. */
      if (token.clubTok && Date.now() - (token.clubVisto ?? 0) > REVALIDAR_CADA_MS) {
        const r = await preguntaAlClub(token.clubTok, 2000);
        token.clubVisto = Date.now();
        if (r.estado === "fuera") return null;
        if (r.estado === "dentro") {
          const papel = papelEnTareas(r.quien.rol);
          if (!papel) return null;
          if (papel !== token.role) {
            await prisma.user.updateMany({ where: { email: token.email }, data: { role: papel } });
            token.role = papel;
          }
        }

        /* Y de paso se recargan las preferencias: el token guardaba los colores de
           cuando se entró, así que un cambio de color en el perfil no se veía hasta
           volver a entrar. */
        const fresco = await prisma.user.findUnique({
          where: { email: token.email },
          select: {
            accentColor: true, backgroundType: true,
            backgroundColor: true, particlesEnabled: true,
            name: true, image: true,
          },
        });
        if (fresco) {
          token.accentColor = fresco.accentColor;
          token.backgroundType = fresco.backgroundType;
          token.backgroundColor = fresco.backgroundColor;
          token.particlesEnabled = fresco.particlesEnabled;
          token.name = fresco.name;
          token.picture = fresco.image ?? token.picture;
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
          // ⚠️ sin foto propia se queda la del Club, no un hueco
          token.picture = dbUser.image ?? token.picture;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.role) session.user.role = token.role;
      session.user.accentColor = token.accentColor ?? "#c9a040";
      session.user.backgroundType = token.backgroundType ?? "PARTICLES";
      session.user.backgroundColor = token.backgroundColor ?? "#05091a";
      session.user.particlesEnabled = token.particlesEnabled ?? true;
      if (token.name) session.user.name = token.name;
      if (token.picture) session.user.image = token.picture;
      session.huella = token.huella;
      return session;
    },
  },
});

export const { signIn, signOut, auth } = nextAuth;
export const { GET, POST } = nextAuth.handlers;
