"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ProjectCard } from "@/components/board/project-card";
import { CreateProjectDialog } from "@/components/board/create-project-dialog";
import type { Platform } from "@prisma/client";

type Project = {
  id: string;
  name: string;
  description: string | null;
  platform: Platform;
  driveLink: string | null;
  color: string;
  archived: boolean;
  createdBy: { name: string | null };
  _count: { tasks: number };
};

export function ProjectsView({ projects }: { projects: Project[] }) {
  const [showArchived, setShowArchived] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const visible = useMemo(
    () => projects.filter((p) => showArchived || !p.archived),
    [projects, showArchived]
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--ink-0)]">Proyectos</h2>
          <p className="text-xs text-[var(--ink-3)]">
            Agrupa contenido por campaña o serie y vincula su material en Drive.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-[var(--ink-2)]">
            Mostrar archivados
            <Switch checked={showArchived} onCheckedChange={setShowArchived} />
          </label>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo proyecto
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {visible.length === 0 && (
        <div className="glass-panel rounded-2xl p-10 text-center text-sm text-[var(--ink-3)]">
          No hay proyectos todavía. Crea el primero para empezar a organizar el contenido.
        </div>
      )}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
