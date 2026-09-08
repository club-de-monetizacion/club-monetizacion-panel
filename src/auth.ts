import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { BackgroundType, Role } from "@prisma/client";

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

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
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
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
      if (!user.email) return false;
      const email = user.email.toLowerCase();
      if (adminEmails.includes(email)) {
        await prisma.user.updateMany({
          where: { email, role: { not: "ADMIN" } },
          data: { role: "ADMIN" },
        });
      }
      return true;
    },
    async jwt({ token, trigger }) {
      if (!token.email) return token;
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
