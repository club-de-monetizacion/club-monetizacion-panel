import { redirect } from "next/navigation";

/**
 * «Mi perfil» ya no vive en Tareas (Diego, 11 nov 2026): Tareas es una herramienta
 * dentro del Club y el perfil se edita en el panel del Club. Quien llegue aquí por un
 * enlace viejo va directo allá.
 */
export default function PerfilPage() {
  redirect("https://clubdemonetizacion.com/perfil");
}
