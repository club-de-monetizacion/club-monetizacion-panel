import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSupportDailyOverview } from "@/lib/data";
import { Avatar } from "@/components/ui/avatar";
import { DailyTasksPanel } from "@/components/support/daily-tasks-panel";

export const dynamic = "force-dynamic";

export default async function SupportDailyTasksOverviewPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/");

  const members = await getSupportDailyOverview();

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[var(--ink-0)]">Tareas diarias — Soporte</h2>
        <p className="text-xs text-[var(--ink-3)]">
          Revisa y edita el checklist de cada miembro de soporte.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {members.map((member) => (
          <div key={member.id} className="glass-panel rounded-2xl p-4">
            <div className="mb-4 flex items-center gap-2.5">
              <Avatar src={member.image} name={member.name} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--ink-0)]">{member.name}</p>
                <p className="truncate text-xs text-[var(--ink-3)]">{member.email}</p>
              </div>
            </div>
            <DailyTasksPanel
              items={member.dailyTaskItems}
              userId={member.id}
              category="SUPPORT"
            />
          </div>
        ))}
        {members.length === 0 && (
          <p className="text-sm text-[var(--ink-3)]">
            No hay miembros con rol de Soporte todavía.
          </p>
        )}
      </div>
    </div>
  );
}
