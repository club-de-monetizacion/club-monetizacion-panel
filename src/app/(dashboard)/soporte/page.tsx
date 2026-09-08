import {
  getSupportTasks,
  getAssignableMembers,
  getCannedResponses,
  getQuickLinks,
} from "@/lib/data";
import { TASK_STATUS_INFO, TASK_STATUS_ORDER } from "@/lib/constants";
import { KanbanBoard } from "@/components/board/kanban-board";
import { CannedResponsesPanel } from "@/components/support/canned-responses-panel";
import { QuickLinksPanel } from "@/components/support/quick-links-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function SupportPage() {
  const [tasks, members, cannedResponses, quickLinks] = await Promise.all([
    getSupportTasks(),
    getAssignableMembers(),
    getCannedResponses(),
    getQuickLinks(),
  ]);

  const columns = TASK_STATUS_ORDER.map((status) => ({
    key: status,
    label: TASK_STATUS_INFO[status].label,
  }));

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[var(--ink-0)]">Soporte</h2>
        <p className="text-xs text-[var(--ink-3)]">
          Tareas del equipo, respuestas rápidas y enlaces siempre a mano.
        </p>
      </div>

      <Tabs defaultValue="tablero">
        <TabsList>
          <TabsTrigger value="tablero">Tablero</TabsTrigger>
          <TabsTrigger value="respuestas">Respuestas rápidas</TabsTrigger>
          <TabsTrigger value="enlaces">Enlaces importantes</TabsTrigger>
        </TabsList>

        <TabsContent value="tablero" className="mt-5">
          <KanbanBoard
            columns={columns}
            groupField="status"
            initialTasks={tasks}
            members={members}
            type="SOPORTE"
          />
        </TabsContent>

        <TabsContent value="respuestas" className="mt-5">
          <CannedResponsesPanel items={cannedResponses} />
        </TabsContent>

        <TabsContent value="enlaces" className="mt-5">
          <QuickLinksPanel items={quickLinks} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
