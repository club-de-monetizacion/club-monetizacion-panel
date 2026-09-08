import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { AnimatedBackground } from "@/components/layout/animated-background";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <AnimatedBackground type="PARTICLES" color="#0b0f19" accent="#8b5cf6" />

      <div className="glass-panel-strong animate-fade-in w-full max-w-sm rounded-2xl p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl font-bold text-white shadow-lg shadow-violet-900/40">
          CM
        </div>
        <h1 className="text-xl font-semibold text-[var(--ink-0)]">
          Club de Monetización
        </h1>
        <p className="mt-1.5 text-sm text-[var(--ink-2)]">
          Panel de control del equipo. Inicia sesión con tu cuenta de Google
          para continuar.
        </p>

        <form
          className="mt-7"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="focus-ring flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-lg transition hover:bg-slate-100 active:scale-[0.99]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar con Google
          </button>
        </form>

        <p className="mt-6 text-xs text-[var(--ink-3)]">
          Acceso exclusivo para el equipo del Club de Monetización.
        </p>
      </div>
    </div>
  );
}
