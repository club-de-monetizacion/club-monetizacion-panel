import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSupportDailyOverview } from "@/lib/data";
import { DailyTasksTeamOverview } from "@/components/support/daily-tasks-team-overview";

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
          Revisa y edita el checklist de cada miembro de soporte. La misma vista está disponible
          en Soporte → Tareas diarias.
        </p>
      </div>

      <DailyTasksTeamOverview members={members} />
    </div>
  );
}
