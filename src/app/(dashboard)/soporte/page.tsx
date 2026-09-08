import { getSupportTasks, getAssignableMembers } from "@/lib/data";
import { TASK_STATUS_INFO, TASK_STATUS_ORDER } from "@/lib/constants";
import { KanbanBoard } from "@/components/board/kanban-board";

export default async function SupportPage() {
  const [tasks, members] = await Promise.all([
    getSupportTasks(),
    getAssignableMembers(),
  ]);

  const columns = TASK_STATUS_ORDER.map((status) => ({
    key: status,
    label: TASK_STATUS_INFO[status].label,
  }));

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[var(--ink-0)]">Tareas de soporte</h2>
        <p className="text-xs text-[var(--ink-3)]">
          Organiza y da seguimiento a las solicitudes del equipo de soporte.
        </p>
      </div>

      <KanbanBoard
        columns={columns}
        groupField="status"
        initialTasks={tasks}
        members={members}
        type="SOPORTE"
      />
    </div>
  );
}
