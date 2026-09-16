import { auth } from "@/auth";
import {
  getSupportTasks,
  getAssignableMembers,
  getCannedResponses,
  getFaqItems,
  getQuickLinks,
  getMyDailyTasks,
  getSupportDailyOverview,
} from "@/lib/data";
import { ensureDefaultDailyTasks } from "@/lib/daily-tasks";
import { TASK_STATUS_INFO, TASK_STATUS_ORDER } from "@/lib/constants";
import { KanbanBoard } from "@/components/board/kanban-board";
import { CannedResponsesPanel } from "@/components/support/canned-responses-panel";
import { FaqPanel } from "@/components/support/faq-panel";
import { QuickLinksPanel } from "@/components/support/quick-links-panel";
import { DailyTasksPanel } from "@/components/support/daily-tasks-panel";
import { DailyTasksTeamOverview } from "@/components/support/daily-tasks-team-overview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const session = await auth();
  const isSupport = session?.user.role === "SOPORTE";
  const isAdmin = session?.user.role === "ADMIN";

  if (isSupport) {
    await ensureDefaultDailyTasks(session.user.id);
  }

  const [tasks, members, cannedResponses, faqItems, quickLinks, dailyTasks, teamDailyTasks] =
    await Promise.all([
      getSupportTasks(),
      getAssignableMembers(),
      getCannedResponses(),
      getFaqItems(),
      getQuickLinks(),
      isSupport ? getMyDailyTasks(session.user.id) : Promise.resolve([]),
      isAdmin ? getSupportDailyOverview() : Promise.resolve([]),
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
          <TabsTrigger value="faq">Preguntas frecuentes</TabsTrigger>
          <TabsTrigger value="enlaces">Enlaces importantes</TabsTrigger>
          {(isSupport || isAdmin) && <TabsTrigger value="diarias">Tareas diarias</TabsTrigger>}
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

        <TabsContent value="faq" className="mt-5">
          <FaqPanel items={faqItems} />
        </TabsContent>

        <TabsContent value="enlaces" className="mt-5">
          <QuickLinksPanel items={quickLinks} />
        </TabsContent>

        {isSupport && (
          <TabsContent value="diarias" className="mt-5">
            <DailyTasksPanel items={dailyTasks} userId={session!.user.id} category="SUPPORT" />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="diarias" className="mt-5">
            <p className="mb-4 text-xs text-[var(--ink-3)]">
              Revisa y edita el checklist de cada miembro de soporte.
            </p>
            <DailyTasksTeamOverview members={teamDailyTasks} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
