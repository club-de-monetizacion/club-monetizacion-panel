import { Avatar } from "@/components/ui/avatar";
import { DailyTasksPanel } from "@/components/support/daily-tasks-panel";
import type { getSupportDailyOverview } from "@/lib/data";

/** The admin-facing view of every support member's daily checklist —
 * shared between the standalone /tareas-diarias-soporte page and the
 * "Tareas diarias" tab under /soporte, so admins land on the same view
 * from either place instead of a separate, easy-to-miss page. */
export function DailyTasksTeamOverview({
  members,
}: {
  members: Awaited<ReturnType<typeof getSupportDailyOverview>>;
}) {
  return (
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
          <DailyTasksPanel items={member.dailyTaskItems} userId={member.id} category="SUPPORT" />
        </div>
      ))}
      {members.length === 0 && (
        <p className="text-sm text-[var(--ink-3)]">No hay miembros con rol de Soporte todavía.</p>
      )}
    </div>
  );
}
