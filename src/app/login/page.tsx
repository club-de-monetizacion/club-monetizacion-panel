import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import { AnimatedBackground } from "@/components/layout/animated-background";
import { AppLogo } from "@/components/layout/app-logo";
import { CampoClave } from "@/components/layout/campo-clave";

/**
 * Se entra con la misma cuenta del panel del Club: los accesos se dan y se quitan en
 * un solo sitio. Aquí no se guarda ninguna contraseña (ver `lib/panel-club.ts`).
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { error } = await searchParams;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <AnimatedBackground type="PARTICLES" color="#0b0f19" accent="#8b5cf6" />

      <div className="glass-panel-strong animate-fade-in w-full max-w-sm rounded-2xl p-8 shadow-2xl">
        <AppLogo className="mx-auto mb-5 h-14 w-14 text-2xl" />
        <h1 className="text-center text-xl font-semibold text-[var(--ink-0)]">
          Club de Monetización
        </h1>
        <p className="mt-1.5 text-center text-sm text-[var(--ink-2)]">
          Entra con la misma cuenta del panel del Club.
        </p>

        <form
          className="mt-7 space-y-3"
          action={async (formData: FormData) => {
            "use server";
            try {
              await signIn("credentials", {
                email: formData.get("email"),
                password: formData.get("password"),
                pin: formData.get("pin"),
                redirectTo: "/",
              });
            } catch (e) {
              // `signIn` lanza el redirect de Next cuando sale bien: ese hay que
              // dejarlo pasar. Solo el fallo de credenciales vuelve al formulario.
              if (e instanceof AuthError) redirect("/login?error=1");
              throw e;
            }
          }}
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-medium text-[var(--ink-2)]"
            >
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              placeholder="tu@correo.com"
              className="focus-ring w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-[var(--ink-0)] placeholder:text-[var(--ink-3)]"
            />
          </div>

          <CampoClave />

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300"
            >
              Correo o contraseña incorrectos, o esa cuenta no tiene acceso al panel.
            </p>
          ) : null}

          <button
            type="submit"
            className="focus-ring flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:brightness-110 active:scale-[0.99]"
          >
            Entrar
          </button>

          {/* Solo para Diego: él no tiene contraseña de equipo, entra al panel con su
              clave maestra y su PIN. Va al final y escondido porque a nadie más le
              sirve, y su contenido se envía con el mismo formulario. */}
          <details className="pt-1">
            <summary className="cursor-pointer list-none text-xs text-[var(--ink-3)] transition hover:text-[var(--ink-2)]">
              Soy Diego · entrar con la clave maestra
            </summary>
            <div className="mt-3">
              <CampoClave
                id="pin"
                name="pin"
                label="PIN del panel"
                autoComplete="off"
                ayuda="Arriba va tu clave maestra y aquí el PIN. Luego pulsa Entrar."
              />
            </div>
          </details>
        </form>

        <p className="mt-5 text-center text-sm">
          <a
            href="https://panel.clubdemonetizacion.com/?olvide=1"
            className="focus-ring rounded text-[var(--ink-2)] underline decoration-white/20 underline-offset-4 transition hover:text-[var(--ink-0)]"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </p>
      </div>
    </div>
  );
}
