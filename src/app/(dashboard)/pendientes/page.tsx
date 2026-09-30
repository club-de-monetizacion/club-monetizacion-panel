import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { misPendientes } from "@/app/actions/pendientes";
import { PendientesBoard } from "@/components/pendientes/pendientes-board";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pendientes" };

/** Los pendientes privados de cada persona: la app de escritorio de Diego, aquí. */
export default async function PendientesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const pendientes = await misPendientes();

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--ink-0)]">Pendientes</h2>
        <p className="text-xs text-[var(--ink-3)]">
          Lo tuyo, al vuelo. Privado: nadie más lo ve.
        </p>
      </div>

      <PendientesBoard inicial={pendientes} />
    </div>
  );
}
