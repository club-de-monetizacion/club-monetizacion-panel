import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPlatformSummary } from "@/lib/data";
import { PLATFORM_INFO, PLATFORM_ORDER } from "@/lib/constants";

export default async function TablerosPage() {
  const { taskCounts, projectCounts } = await getPlatformSummary();

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--ink-0)]">
          Tableros de contenido
        </h2>
        <p className="text-sm text-[var(--ink-2)]">
          Sigue el contenido en cada plataforma, desde la idea hasta la publicación.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLATFORM_ORDER.map((platform) => {
          const info = PLATFORM_INFO[platform];
          const tasks = taskCounts.find((t) => t.platform === platform)?._count ?? 0;
          const projects = projectCounts.find((p) => p.platform === platform)?._count ?? 0;
          return (
            <Link
              key={platform}
              href={`/tableros/${platform.toLowerCase()}`}
              className="glass-panel group rounded-2xl p-5 transition hover:border-[var(--panel-strong)] hover:-translate-y-0.5"
            >
              <div className="mb-4 flex items-center justify-between">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                  style={{ background: `${info.color}22` }}
                >
                  {info.emoji}
                </span>
                <ArrowRight className="h-4 w-4 text-[var(--ink-3)] transition group-hover:translate-x-1 group-hover:text-[var(--accent)]" />
              </div>
              <h3 className="text-base font-semibold text-[var(--ink-0)]">
                {info.label}
              </h3>
              <p className="mt-1 text-xs text-[var(--ink-3)]">
                {projects} proyecto{projects === 1 ? "" : "s"} · {tasks} pieza
                {tasks === 1 ? "" : "s"} de contenido
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
