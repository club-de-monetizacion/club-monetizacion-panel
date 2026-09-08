import Link from "next/link";
import { CheckCircle2, LifeBuoy, Users, Video } from "lucide-react";
import { auth } from "@/auth";
import { getDashboardData } from "@/lib/data";
import { MiniTaskRow } from "@/components/board/mini-task-row";
import { PLATFORM_INFO } from "@/lib/constants";

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user;
  const data = await getDashboardData(user.id);

  const supportOpen = data.supportCounts
    .filter((c) => c.status !== "COMPLETADA")
    .reduce((sum, c) => sum + c._count, 0);
  const contentInProgress = data.contentCounts
    .filter((c) => c.stage && c.stage !== "PUBLICADO")
    .reduce((sum, c) => sum + c._count, 0);

  const firstName = user.name?.split(" ")[0] ?? "";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--ink-0)]">
          {greeting}, {firstName} 👋
        </h2>
        <p className="text-sm text-[var(--ink-2)]">
          Esto es lo que está pasando en el equipo hoy.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Mis tareas pendientes"
          value={data.myTasks.length}
          href="/soporte"
        />
        <StatCard
          icon={<LifeBuoy className="h-4 w-4" />}
          label="Soporte abierto"
          value={supportOpen}
          href="/soporte"
        />
        <StatCard
          icon={<Video className="h-4 w-4" />}
          label="Contenido en producción"
          value={contentInProgress}
          href="/tableros"
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Miembros del equipo"
          value={data.totalMembers}
          href="/equipo"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl p-4">
          <h3 className="mb-2 px-1 text-sm font-semibold text-[var(--ink-0)]">
            Mis tareas
          </h3>
          <div className="space-y-0.5">
            {data.myTasks.map((task) => (
              <MiniTaskRow key={task.id} task={task} />
            ))}
            {data.myTasks.length === 0 && (
              <p className="px-2 py-4 text-sm text-[var(--ink-3)]">
                No tienes tareas pendientes asignadas. 🎉
              </p>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4">
          <h3 className="mb-2 px-1 text-sm font-semibold text-[var(--ink-0)]">
            Próximos vencimientos
          </h3>
          <div className="space-y-0.5">
            {data.upcoming.map((task) => (
              <MiniTaskRow key={task.id} task={task} />
            ))}
            {data.upcoming.length === 0 && (
              <p className="px-2 py-4 text-sm text-[var(--ink-3)]">
                No hay fechas límite próximas.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-[var(--ink-0)]">
            Proyectos recientes
          </h3>
          <Link href="/proyectos" className="text-xs text-[var(--accent)] hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {data.recentProjects.map((p) => {
            const info = PLATFORM_INFO[p.platform];
            return (
              <Link
                key={p.id}
                href={`/tableros/${p.platform.toLowerCase()}`}
                className="flex items-center gap-2.5 rounded-lg border border-[var(--panel-border)] p-2.5 transition hover:bg-[var(--panel)]"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
                  style={{ background: `${info.color}22` }}
                >
                  {info.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-[var(--ink-0)]">{p.name}</p>
                  <p className="text-[11px] text-[var(--ink-3)]">
                    {p._count.tasks} tareas
                  </p>
                </div>
              </Link>
            );
          })}
          {data.recentProjects.length === 0 && (
            <p className="px-2 py-4 text-sm text-[var(--ink-3)]">
              Aún no hay proyectos creados.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link href={href} className="glass-panel flex items-center gap-3 rounded-2xl p-4 transition hover:border-[var(--panel-strong)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
        {icon}
      </div>
      <div>
        <p className="text-xl font-semibold text-[var(--ink-0)]">{value}</p>
        <p className="text-xs text-[var(--ink-3)]">{label}</p>
      </div>
    </Link>
  );
}
