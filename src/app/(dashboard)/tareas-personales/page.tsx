import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMyPersonalTasksBoard } from "@/lib/data";
import { PersonalTasksBoard } from "@/components/personal/personal-tasks-board";

export const dynamic = "force-dynamic";

export default async function PersonalTasksPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const { active, archived } = await getMyPersonalTasksBoard(session.user.id);

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[var(--ink-0)]">Tareas personales</h2>
        <p className="text-xs text-[var(--ink-3)]">
          Tu propio espacio de ideas y pendientes — privado, solo tú lo ves y lo editas.
        </p>
      </div>

      <PersonalTasksBoard active={active} archived={archived} />
    </div>
  );
}
