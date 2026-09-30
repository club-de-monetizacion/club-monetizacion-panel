import { redirect } from "next/navigation";

/** Se llamaba "Tareas personales"; ahora es "Pendientes". */
export default function TareasPersonalesPage() {
  redirect("/pendientes");
}
