import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSupportDailyOverview } from "@/lib/data";
import { Avatar } from "@/components/ui/avatar";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
          Progreso de hoy de cada miembro del equipo de soporte.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {members.map((member) => {
          const total = member.dailyTaskItems.length;
          const done = member.dailyTaskItems.filter((item) => item.logs.length > 0).length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <div key={member.id} className="glass-panel rounded-2xl p-4">
              <div className="mb-3 flex items-center gap-2.5">
                <Avatar src={member.image} name={member.name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--ink-0)]">
                    {member.name}
                  </p>
                  <p className="truncate text-xs text-[var(--ink-3)]">{member.email}</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-[var(--ink-2)]">
                  {done}/{total} · {pct}%
                </span>
              </div>

              <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[var(--panel-strong)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="space-y-1">
                {member.dailyTaskItems.map((item) => {
                  const isDone = item.logs.length > 0;
                  return (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                          isDone
                            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                            : "border-[var(--panel-border)] text-transparent"
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                      <span
                        className={cn(
                          isDone ? "text-[var(--ink-3)] line-through" : "text-[var(--ink-1)]"
                        )}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
                {total === 0 && (
                  <p className="text-xs text-[var(--ink-3)]">Sin tareas configuradas todavía.</p>
                )}
              </div>
            </div>
          );
        })}
        {members.length === 0 && (
          <p className="text-sm text-[var(--ink-3)]">
            No hay miembros con rol de Soporte todavía.
          </p>
        )}
      </div>
    </div>
  );
}
