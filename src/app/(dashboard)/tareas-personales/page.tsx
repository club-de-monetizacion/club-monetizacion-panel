import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMyPersonalTasks } from "@/lib/data";
import { DailyTasksPanel } from "@/components/support/daily-tasks-panel";

export const dynamic = "force-dynamic";

export default async function PersonalTasksPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const items = await getMyPersonalTasks(session.user.id);

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[var(--ink-0)]">Tareas personales</h2>
        <p className="text-xs text-[var(--ink-3)]">
          Tu checklist diario personal o de trabajo — solo tú lo ves.
        </p>
      </div>

      <DailyTasksPanel items={items} userId={session.user.id} category="PERSONAL" />
    </div>
  );
}
