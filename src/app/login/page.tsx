import { PantallaCarga } from "@/components/layout/pantalla-carga";
import { Reintenta } from "@/components/layout/reintenta";
import { rutaSegura } from "@/lib/club-sso";

/**
 * ⚠️ /login YA NO ES UN FORMULARIO.
 *
 * Tareas se abre con la sesión del Club y con ninguna otra (Diego: «por qué hay
 * un login en tareas», «ya quita esa mierda»). Quien llega aquí lo resuelve el
 * portero (`authorized` en `auth.ts`) con redirecciones del servidor: sin sesión
 * del Club, al acceso del Club; con ella, a entrar sola.
 *
 * Esta página solo se pinta cuando el Club no contestó a tiempo: es la pantalla
 * de carga del Club, que vuelve a probar sola. Si sigue sin contestar, se va al
 * Club. Nunca se ve un campo de correo ni de contraseña.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reintento?: string; volver?: string }>;
}) {
  const { reintento, volver } = await searchParams;
  const intento = Number(reintento ?? "0") || 0;
  const otraVez =
    "/api/entrar-club?volver=" +
    encodeURIComponent(rutaSegura(volver)) +
    "&intento=" +
    intento;

  return (
    <>
      <PantallaCarga />
      <Reintenta a={otraVez} />
    </>
  );
}
